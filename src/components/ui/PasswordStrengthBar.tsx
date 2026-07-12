import { getPasswordStrength } from '../../lib/validation'
import './PasswordStrengthBar.css'

interface PasswordStrengthBarProps {
  password: string
}

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const strength = getPasswordStrength(password)
  if (!password) return null

  return (
    <div className="password-strength" aria-live="polite">
      <div className="password-strength__header">
        <span className="password-strength__label">Password strength</span>
        <span className="password-strength__value" style={{ color: strength.color }}>
          {strength.label}
        </span>
      </div>
      <div className="password-strength__track" aria-hidden="true">
        <div
          className="password-strength__fill"
          style={{ width: `${strength.percent}%`, backgroundColor: strength.color }}
        />
      </div>
      <ul className="password-strength__checks">
        {strength.checks.map((check) => (
          <li key={check.id} className={check.met ? 'is-met' : ''}>
            {check.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
