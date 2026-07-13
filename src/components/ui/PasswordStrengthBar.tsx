import { getPasswordStrength } from '../../lib/validation'
import './PasswordStrengthBar.css'

interface PasswordStrengthBarProps {
  password: string
}

const SEGMENT_COUNT = 4

function getFilledSegments(metCount: number) {
  if (metCount <= 1) return 1
  if (metCount === 2) return 2
  if (metCount === 3) return 3
  return 4
}

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const strength = getPasswordStrength(password)
  const metCount = strength.checks.filter((check) => check.met).length
  const filledSegments = password ? getFilledSegments(metCount) : 0

  return (
    <div className="password-strength" aria-live="polite">
      <div className="password-strength__header">
        <span className="password-strength__label">Password strength</span>
        <span
          className="password-strength__value"
          style={{ color: password ? strength.color : 'var(--text-secondary)' }}
        >
          {password ? strength.label : 'Start typing'}
        </span>
      </div>

      <div className="password-strength__segments" aria-hidden="true">
        {Array.from({ length: SEGMENT_COUNT }, (_, index) => (
          <span
            key={index}
            className={`password-strength__segment${index < filledSegments ? ' is-filled' : ''}`}
            style={index < filledSegments ? { backgroundColor: strength.color } : undefined}
          />
        ))}
      </div>

      <div className="password-strength__track" aria-hidden="true">
        <div
          className="password-strength__fill"
          style={{
            width: password ? `${strength.percent}%` : '0%',
            backgroundColor: password ? strength.color : 'transparent',
          }}
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
