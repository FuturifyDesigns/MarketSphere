export type ValidationResult = string | null

export type FieldErrors<T extends string> = Partial<Record<T, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^(\+267|0)?[\d\s-]+$/
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function trim(value: string) {
  return value.trim()
}

export function validateRequired(
  value: string,
  fieldLabel: string,
  min = 1,
  max = 255,
): ValidationResult {
  const v = trim(value)
  if (!v) return `${fieldLabel} is required`
  if (v.length < min) return `${fieldLabel} must be at least ${min} characters`
  if (v.length > max) return `${fieldLabel} must be at most ${max} characters`
  return null
}

export function validateEmail(value: string): ValidationResult {
  const v = trim(value)
  if (!v) return 'Email is required'
  if (v.length > 254) return 'Email is too long'
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address'
  return null
}

export function validateOptionalEmail(value: string): ValidationResult {
  const v = trim(value)
  if (!v) return null
  return validateEmail(v)
}

export function validatePassword(value: string): ValidationResult {
  if (!value) return 'Password is required'
  if (value.length < 8) return 'Password must be at least 8 characters'
  if (value.length > 72) return 'Password must be at most 72 characters'
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return 'Password must include at least one letter and one number'
  }
  return null
}

export function validateName(value: string, fieldLabel = 'Name'): ValidationResult {
  const required = validateRequired(value, fieldLabel, 2, 100)
  if (required) return required
  const v = trim(value)
  if (!/^[\p{L}\p{M}' .-]+$/u.test(v)) {
    return `${fieldLabel} contains invalid characters`
  }
  return null
}

export function validatePhone(value: string, optional = true): ValidationResult {
  const v = trim(value)
  if (!v) return optional ? null : 'Phone number is required'
  if (!PHONE_RE.test(v)) return 'Enter a valid phone number'
  const digits = v.replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 15) return 'Enter a valid phone number'
  return null
}

export function validateMessage(value: string, min = 10, max = 2000): ValidationResult {
  return validateRequired(value, 'Message', min, max)
}

export function validateSubject(value: string): ValidationResult {
  return validateRequired(value, 'Subject', 3, 120)
}

export function validateBusinessName(value: string): ValidationResult {
  return validateRequired(value, 'Business name', 2, 120)
}

export function validateDescription(value: string, optional = true, min = 10): ValidationResult {
  const v = trim(value)
  if (!v) return optional ? null : 'Description is required'
  if (v.length < min) return `Description must be at least ${min} characters`
  if (v.length > 2000) return 'Description must be at most 2000 characters'
  return null
}

export function validateLocation(value: string): ValidationResult {
  const v = trim(value)
  if (!v) return null
  if (v.length > 120) return 'Location must be at most 120 characters'
  return null
}

export function validateSlug(value: string): ValidationResult {
  const v = trim(value)
  if (!v) return 'Slug is required'
  if (!SLUG_RE.test(v)) return 'Use lowercase letters, numbers, and hyphens only'
  if (v.length > 80) return 'Slug is too long'
  return null
}

export function validateServiceTitle(value: string): ValidationResult {
  return validateRequired(value, 'Service title', 2, 120)
}

export function validateServiceDescription(value: string): ValidationResult {
  const v = trim(value)
  if (!v) return null
  if (v.length > 500) return 'Service description must be at most 500 characters'
  return null
}

export function validateCategoryName(value: string): ValidationResult {
  return validateRequired(value, 'Category name', 2, 80)
}

export function validateTestimonialContent(value: string): ValidationResult {
  return validateRequired(value, 'Testimonial', 10, 1000)
}

export function validateClientName(value: string): ValidationResult {
  return validateName(value, 'Client name')
}

export function collectErrors<T extends string>(
  checks: Array<[T, ValidationResult]>,
): FieldErrors<T> {
  const errors: FieldErrors<T> = {}
  for (const [field, err] of checks) {
    if (err) errors[field] = err
  }
  return errors
}

export function hasErrors<T extends string>(errors: FieldErrors<T>) {
  return Object.keys(errors).length > 0
}

export function clearFieldError<T extends string>(
  errors: FieldErrors<T>,
  field: T,
): FieldErrors<T> {
  if (!errors[field]) return errors
  const next = { ...errors }
  delete next[field]
  return next
}

export function slugify(value: string) {
  return trim(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
