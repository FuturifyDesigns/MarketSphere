import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import './Input.css'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  hint?: string
  error?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, hint, error, className = '', id, ...props }, ref) => {
    const [visible, setVisible] = useState(false)
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const errorId = inputId ? `${inputId}-error` : undefined
    const hintId = inputId ? `${inputId}-hint` : undefined
    const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

    return (
      <div className={`input-group input-group--password ${error ? 'input-group--error' : ''} ${className}`}>
        {label ? <label htmlFor={inputId}>{label}</label> : null}
        <div className="input-password-wrap">
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            {...props}
          />
          <button
            type="button"
            className="input-password-toggle"
            onClick={() => setVisible((value) => !value)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            tabIndex={-1}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {hint && !error ? (
          <span id={hintId} className="input-hint">
            {hint}
          </span>
        ) : null}
        {error ? (
          <span id={errorId} className="input-error" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    )
  },
)

PasswordInput.displayName = 'PasswordInput'
