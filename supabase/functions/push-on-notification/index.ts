// Supabase Edge Function: fan-out FCM when a row is inserted into public.notifications,
// or broadcast to an FCM topic (guest new-listing alerts).
//
// Deploy:
//   supabase functions deploy push-on-notification --no-verify-jwt
//   supabase secrets set FCM_SERVICE_ACCOUNT_JSON='<<paste Firebase service account JSON>>'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

type ServiceAccount = {
  project_id: string
  client_email: string
  private_key: string
  token_uri?: string
}

type NotificationRow = {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  link: string | null
}

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function b64url(data: string | ArrayBuffer): string {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const cleaned = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const raw = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0))
  return crypto.subtle.importKey(
    'pkcs8',
    raw.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: sa.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claim))}`
  const key = await importPrivateKey(sa.private_key)
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(unsigned),
  )
  const jwt = `${unsigned}.${b64url(sig)}`
  const res = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) {
    throw new Error(`token exchange failed: ${await res.text()}`)
  }
  const json = await res.json()
  return json.access_token as string
}

function fcmMessageBody(note: NotificationRow, target: { token?: string; topic?: string }) {
  return {
    message: {
      ...(target.token ? { token: target.token } : {}),
      ...(target.topic ? { topic: target.topic } : {}),
      notification: {
        title: note.title,
        body: note.body,
      },
      data: {
        type: note.type ?? 'info',
        link: note.link ?? '',
        notification_id: note.id ?? '',
      },
      android: {
        priority: 'HIGH',
        notification: {
          channel_id: 'engagement_alerts_v3',
          sound: 'notif_sound',
          default_sound: false,
        },
      },
    },
  }
}

async function sendFcm(
  accessToken: string,
  projectId: string,
  note: NotificationRow,
  target: { token?: string; topic?: string },
) {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fcmMessageBody(note, target)),
  })
  if (!res.ok) {
    const text = await res.text()
    console.error('FCM send failed', text)
    return { ok: false, text }
  }
  return { ok: true, text: await res.text() }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors })
  }

  try {
    const saRaw = Deno.env.get('FCM_SERVICE_ACCOUNT_JSON')
    if (!saRaw) {
      return new Response(JSON.stringify({ error: 'FCM_SERVICE_ACCOUNT_JSON missing' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }
    const sa = JSON.parse(saRaw) as ServiceAccount

    const payload = await req.json()
    const record = (payload.record ?? payload.new ?? payload) as NotificationRow
    const broadcastTopic =
      typeof payload.broadcast_topic === 'string' ? payload.broadcast_topic.trim() : ''

    if (!record?.title) {
      return new Response(JSON.stringify({ error: 'invalid notification payload' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const accessToken = await getAccessToken(sa)

    // Guest / broadcast path: one message to an FCM topic (e.g. new_listings).
    if (broadcastTopic) {
      const result = await sendFcm(accessToken, sa.project_id, record, { topic: broadcastTopic })
      return new Response(
        JSON.stringify({ sent: result.ok ? 1 : 0, topic: broadcastTopic, ok: result.ok }),
        { headers: { ...cors, 'Content-Type': 'application/json' } },
      )
    }

    if (!record.user_id) {
      return new Response(JSON.stringify({ error: 'invalid notification payload' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: tokens, error } = await supabase
      .from('device_tokens')
      .select('token, platform')
      .eq('user_id', record.user_id)
      .eq('platform', 'android')

    if (error) throw error
    const deviceTokens = (tokens ?? [])
      .map((t) => String(t.token))
      .filter((t) => t && !t.startsWith('local-'))

    if (deviceTokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no_fcm_tokens' }), {
        headers: { ...cors, 'Content-Type': 'application/json' },
      })
    }

    let sent = 0
    for (const token of deviceTokens) {
      const result = await sendFcm(accessToken, sa.project_id, record, { token })
      if (result.ok) sent += 1
    }

    return new Response(JSON.stringify({ sent, total: deviceTokens.length }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})
