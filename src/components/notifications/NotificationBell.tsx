import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import type { Notification } from '../../lib/types'
import './NotificationBell.css'

function formatWhen(value: string) {
  const date = new Date(value)
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function NotificationBell() {
  const { notifications, unreadCount, openNotification, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  const handleOpen = async (notification: Notification) => {
    setOpen(false)
    await openNotification(notification)
  }

  return (
    <div className="notification-bell" ref={rootRef}>
      <button
        type="button"
        className="notification-bell__trigger"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 ? <span className="notification-bell__badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="notification-bell__panel" role="dialog" aria-label="Notifications">
          <div className="notification-bell__header">
            <strong>Notifications</strong>
            {unreadCount > 0 ? (
              <button type="button" className="notification-bell__mark-all" onClick={() => void markAllRead()}>
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="notification-bell__list">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={notification.read_at ? 'notification-bell__item' : 'notification-bell__item notification-bell__item--unread'}
                  onClick={() => void handleOpen(notification)}
                >
                  <span className="notification-bell__item-title">{notification.title}</span>
                  <span className="notification-bell__item-body">{notification.body}</span>
                  <span className="notification-bell__item-time">{formatWhen(notification.created_at)}</span>
                </button>
              ))
            ) : (
              <p className="notification-bell__empty">You&apos;re all caught up.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
