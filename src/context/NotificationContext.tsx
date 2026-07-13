import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'
import type { Notification } from '../lib/types'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  openNotification: (notification: Notification) => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

function mapNotification(row: Record<string, unknown>): Notification {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    type: String(row.type),
    title: String(row.title),
    body: String(row.body),
    link: row.link ? String(row.link) : null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    read_at: row.read_at ? String(row.read_at) : null,
    created_at: String(row.created_at),
  }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([])
      return
    }

    setLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(40)

    setNotifications((data || []).map((row) => mapNotification(row as Record<string, unknown>)))
    setLoading(false)
  }, [user])

  useEffect(() => {
    void refreshNotifications()
  }, [refreshNotifications])

  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        () => {
          void refreshNotifications()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refreshNotifications, user])

  const markRead = useCallback(async (id: string) => {
    const readAt = new Date().toISOString()
    setNotifications((current) =>
      current.map((item) => (item.id === id ? { ...item, read_at: readAt } : item)),
    )
    await supabase.from('notifications').update({ read_at: readAt }).eq('id', id)
  }, [])

  const markAllRead = useCallback(async () => {
    if (!user) return
    const readAt = new Date().toISOString()
    setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || readAt })))
    await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .eq('user_id', user.id)
      .is('read_at', null)
  }, [user])

  const openNotification = useCallback(
    async (notification: Notification) => {
      if (!notification.read_at) {
        await markRead(notification.id)
      }

      const tab = typeof notification.metadata?.tab === 'string' ? notification.metadata.tab : undefined
      if (notification.link) {
        navigate(notification.link, tab ? { state: { tab } } : undefined)
      }
    },
    [markRead, navigate],
  )

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications],
  )

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      markRead,
      markAllRead,
      openNotification,
      refreshNotifications,
    }),
    [loading, markAllRead, markRead, notifications, openNotification, refreshNotifications, unreadCount],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider')
  return ctx
}
