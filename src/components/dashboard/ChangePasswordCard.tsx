import { useState, type FormEvent } from 'react'
import { KeyRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'
import { PasswordInput } from '../ui/PasswordInput'
import { PasswordStrengthBar } from '../ui/PasswordStrengthBar'
import {
  clearFieldError,
  collectErrors,
  FIELD_HINTS,
  hasErrors,
  validatePassword,
  type FieldErrors,
} from '../../lib/validation'
import './ChangePasswordCard.css'

type PasswordFields = 'password' | 'confirmPassword'

export function ChangePasswordCard() {
  const { updatePassword } = useAuth()
  const { showToast } = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<PasswordFields>>({})
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError('')

    const nextErrors = collectErrors<PasswordFields>([
      ['password', validatePassword(password)],
      [
        'confirmPassword',
        !confirmPassword
          ? 'Confirm your new password'
          : password !== confirmPassword
            ? 'Passwords do not match'
            : null,
      ],
    ])
    setFieldErrors(nextErrors)
    if (hasErrors(nextErrors)) return

    setSaving(true)
    try {
      const { error } = await updatePassword(password)
      if (error) {
        setFormError(error.message || 'Could not update password.')
        showToast(error.message || 'Could not update password.', 'error')
        return
      }
      setPassword('')
      setConfirmPassword('')
      setFieldErrors({})
      showToast('Password updated.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not update password.'
      setFormError(message)
      showToast(message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="change-password-card">
      <div className="change-password-card__header">
        <span className="change-password-card__icon" aria-hidden="true">
          <KeyRound size={20} />
        </span>
        <div>
          <span className="change-password-card__eyebrow">Settings</span>
          <h2>Change password</h2>
          <p>Set a new password for your admin account. It takes effect immediately.</p>
        </div>
      </div>

      <form className="change-password-card__form" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <PasswordInput
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value)
            setFieldErrors((prev) => clearFieldError(prev, 'password'))
          }}
          hint={FIELD_HINTS.password}
          error={fieldErrors.password}
        />

        {password ? <PasswordStrengthBar password={password} /> : null}

        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value)
            setFieldErrors((prev) => clearFieldError(prev, 'confirmPassword'))
          }}
          error={fieldErrors.confirmPassword}
        />

        {formError ? (
          <p className="change-password-card__error" role="alert">
            {formError}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={saving}>
          {saving ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </section>
  )
}
