import { forwardRef, type TextareaHTMLAttributes } from 'react'
import './Input.css'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, rows = 4, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const errorId = inputId ? `${inputId}-error` : undefined

    return (
      <div className={`input-group ${error ? 'input-group--error' : ''} ${className}`}>
        {label && <label htmlFor={inputId}>{label}</label>}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className="input-field"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...props}
        />
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
