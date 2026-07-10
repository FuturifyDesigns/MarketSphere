import { forwardRef, type InputHTMLAttributes } from 'react'
import './Input.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className={`input-group ${className}`}>
        {label && <label htmlFor={inputId}>{label}</label>}
        <input ref={ref} id={inputId} {...props} />
        {error && <span className="input-error">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
