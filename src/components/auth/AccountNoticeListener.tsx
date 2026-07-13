import { useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import { consumeAccountNotice } from '../../lib/accountGuard'

export function AccountNoticeListener() {
  const { showToast } = useToast()

  useEffect(() => {
    const message = consumeAccountNotice()
    if (message) {
      showToast(message, 'error')
    }
  }, [showToast])

  return null
}
