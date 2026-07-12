import { forwardRef, type TextareaHTMLAttributes } from 'react'
import './Input.css'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  hint?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className = '', id, rows = 4, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const errorId = inputId ? `${inputId}-error` : undefined
    const hintId = inputId ? `${inputId}-hint` : undefined
    const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

    return (
      <div className={`input-group ${error ? 'input-group--error' : ''} ${className}`}>
        {label && <label htmlFor={inputId}>{label}</label>}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className="input-field"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {hint && !error && (
          <span id={hintId} className="input-hint">
            {hint}
          </span>
        )}
        {error && (
          <span id={errorId} className="input-error" role="alert">
            {error}
          </span>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
