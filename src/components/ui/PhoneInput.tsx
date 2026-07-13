import { PHONE_COUNTRY_CODES, sanitizePhoneLocal } from '../../lib/validation'
import './PhoneInput.css'

interface PhoneInputProps {
  label?: string
  hint?: string
  error?: string
  countryCode: string
  localNumber: string
  onCountryCodeChange: (code: string) => void
  onLocalNumberChange: (value: string) => void
  optional?: boolean
}

export function PhoneInput({
  label = 'Phone',
  hint,
  error,
  countryCode,
  localNumber,
  onCountryCodeChange,
  onLocalNumberChange,
  optional = true,
}: PhoneInputProps) {
  const inputId = 'phone-local'
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={`input-group phone-input ${error ? 'input-group--error' : ''}`}>
      <label htmlFor={inputId}>
        {label}
        {optional ? ' (optional)' : ''}
      </label>
      <div className="phone-input__row">
        <select
          className="phone-input__code"
          value={countryCode}
          onChange={(e) => onCountryCodeChange(e.target.value)}
          aria-label="Country code"
        >
          {PHONE_COUNTRY_CODES.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.label} {entry.code}
            </option>
          ))}
        </select>
        <input
          id={inputId}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="71 234 567"
          value={localNumber}
          onChange={(e) => onLocalNumberChange(sanitizePhoneLocal(e.target.value))}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
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
}
