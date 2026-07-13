import { supabase } from './supabase'
import { prepareSiteImage } from './imageUpload'

export async function uploadSiteAsset(file: File, folder = 'general'): Promise<string> {
  const prepared = await prepareSiteImage(file)
  const path = `${folder}/${crypto.randomUUID()}.jpg`

  const { error } = await supabase.storage.from('site-assets').upload(path, prepared, {
    cacheControl: '3600',
    upsert: false,
    contentType: 'image/jpeg',
  })

  if (error) throw error

  const { data } = supabase.storage.from('site-assets').getPublicUrl(path)
  return data.publicUrl
}
