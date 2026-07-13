export type ValidationResult = string | null

export type FieldErrors<T extends string> = Partial<Record<T, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^(\+267|0)?[\d\s-]+$/
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const PERSON_NAME_RE = /^[\p{L}\p{M}' .-]+$/u
const TEXT_WITH_LETTERS_RE = /[\p{L}]/u

export const FIELD_HINTS = {
  fullName: 'Use your real name — letters only, 2–100 characters.',
  email: 'Use a valid email you can access for confirmations.',
  password: 'At least 8 characters with a letter, number, and mixed case for a strong password.',
  phone: 'Enter your mobile number without the country code.',
  message: 'Describe your request clearly — at least 10 characters.',
  subject: 'Short summary of your enquiry — letters required.',
  businessName: 'Your registered or trading name — must include letters.',
  description: 'Tell customers what you offer — at least 20 characters.',
  location: 'City, town, or area in Botswana — not numbers only.',
  contactEmail: 'Optional business email customers can reach you on.',
  contactPhone: 'Optional business phone — digits only.',
  serviceTitle: 'Name of the service you provide — at least 2 characters.',
  serviceDescription: 'Optional details about this service — up to 500 characters.',
  categoryName: 'Display name shown in browse filters.',
  categorySlug: 'URL-friendly ID: lowercase letters, numbers, and hyphens.',
  categoryDescription: 'Optional short summary for this category.',
  clientName: 'First name or initials — letters only.',
  testimonialContent: 'What the client said — at least 10 characters.',
  serviceType: 'Optional label, e.g. Academic Tuition.',
} as const

export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong'

export interface PasswordStrength {
  level: PasswordStrengthLevel
  label: string
  percent: number
  color: string
  checks: Array<{ id: string; label: string; met: boolean }>
}

export function trim(value: string) {
  return value.trim()
}

function hasLetters(value: string) {
  return TEXT_WITH_LETTERS_RE.test(value)
}

function isNumericOnly(value: string) {
  return /^-?\d+(\.\d+)?$/.test(value.replace(/\s/g, ''))
}

export function sanitizePersonName(value: string) {
  return value.replace(/\d/g, '')
}

export function sanitizeSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, '')
}

export function sanitizePhone(value: string) {
  return value.replace(/[^\d\s+-]/g, '')
}

export function sanitizePhoneLocal(value: string) {
  return value.replace(/[^\d\s]/g, '')
}

export const PHONE_COUNTRY_CODES = [
  { code: '+267', label: 'BW', name: 'Botswana' },
  { code: '+27', label: 'ZA', name: 'South Africa' },
  { code: '+264', label: 'NA', name: 'Namibia' },
  { code: '+260', label: 'ZM', name: 'Zambia' },
  { code: '+263', label: 'ZW', name: 'Zimbabwe' },
] as const

export function formatPhoneWithCountry(countryCode: string, localNumber: string) {
  const digits = localNumber.replace(/\D/g, '')
  if (!digits) return ''
  const normalized = digits.startsWith('0') ? digits.slice(1) : digits
  return `${countryCode} ${normalized}`
}

export function validatePhoneLocal(localNumber: string, optional = true): ValidationResult {
  const v = trim(localNumber)
  if (!v) return optional ? null : 'Phone number is required'
  if (/[A-Za-z]/.test(v)) return 'Phone number should only contain digits'
  const digits = v.replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 12) return 'Enter a valid phone number'
  return null
}

export function getPasswordStrength(password: string): PasswordStrength {
  const checks = [
    { id: 'length', label: 'At least 8 characters', met: password.length >= 8 },
    { id: 'letter', label: 'Contains a letter', met: /[A-Za-z]/.test(password) },
    { id: 'number', label: 'Contains a number', met: /\d/.test(password) },
    { id: 'case', label: 'Upper and lower case', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { id: 'symbol', label: 'Contains a symbol', met: /[^A-Za-z0-9]/.test(password) },
  ]

  if (!password) {
    return { level: 'empty', label: '', percent: 0, color: '#d1d5db', checks }
  }

  const metCount = checks.filter((check) => check.met).length
  const percent = Math.min(100, (metCount / checks.length) * 100)

  if (metCount <= 2) {
    return { level: 'weak', label: 'Weak', percent: Math.max(percent, 20), color: '#dc4c4c', checks }
  }
  if (metCount === 3) {
    return { level: 'fair', label: 'Fair', percent: 55, color: '#d97706', checks }
  }
  if (metCount === 4) {
    return { level: 'good', label: 'Good', percent: 78, color: '#c9a24b', checks }
  }
  return { level: 'strong', label: 'Strong', percent: 100, color: '#3a9d5c', checks }
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
  if (getPasswordStrength(value).level === 'weak') {
    return 'Choose a stronger password — add mixed case or a symbol'
  }
  return null
}

export function validateName(value: string, fieldLabel = 'Name'): ValidationResult {
  const required = validateRequired(value, fieldLabel, 2, 100)
  if (required) return required
  const v = trim(value)
  if (/\d/.test(v)) return `${fieldLabel} should not contain numbers`
  if (!PERSON_NAME_RE.test(v)) {
    return `${fieldLabel} can only include letters, spaces, hyphens, and apostrophes`
  }
  return null
}

export function validatePhone(value: string, optional = true): ValidationResult {
  const v = trim(value)
  if (!v) return optional ? null : 'Phone number is required'
  if (/[A-Za-z]/.test(v)) return 'Phone number should only contain digits'
  if (!PHONE_RE.test(v)) return 'Enter a valid phone number'
  const digits = v.replace(/\D/g, '')
  if (digits.length < 7 || digits.length > 15) return 'Enter a valid phone number'
  return null
}

export function validateMessage(value: string, min = 10, max = 2000): ValidationResult {
  const required = validateRequired(value, 'Message', min, max)
  if (required) return required
  if (isNumericOnly(trim(value))) return 'Message cannot be only numbers'
  if (!hasLetters(trim(value))) return 'Message must include some text'
  return null
}

export function validateSubject(value: string): ValidationResult {
  const required = validateRequired(value, 'Subject', 3, 120)
  if (required) return required
  const v = trim(value)
  if (isNumericOnly(v)) return 'Subject cannot be only numbers'
  if (!hasLetters(v)) return 'Subject must include letters'
  return null
}

export function validateBusinessName(value: string): ValidationResult {
  const required = validateRequired(value, 'Business name', 2, 120)
  if (required) return required
  const v = trim(value)
  if (isNumericOnly(v)) return 'Business name cannot be only numbers'
  if (!hasLetters(v)) return 'Business name must include letters'
  return null
}

export function validateDescription(value: string, optional = true, min = 10): ValidationResult {
  const v = trim(value)
  if (!v) return optional ? null : 'Description is required'
  if (v.length < min) return `Description must be at least ${min} characters`
  if (v.length > 2000) return 'Description must be at most 2000 characters'
  if (isNumericOnly(v)) return 'Description cannot be only numbers'
  return null
}

export function validateLocation(value: string): ValidationResult {
  const v = trim(value)
  if (!v) return null
  if (v.length > 120) return 'Location must be at most 120 characters'
  if (isNumericOnly(v)) return 'Location must be a place name, not only numbers'
  if (!hasLetters(v)) return 'Location must include letters'
  return null
}

export function validateSlug(value: string): ValidationResult {
  const v = trim(value)
  if (!v) return 'Slug is required'
  if (!SLUG_RE.test(v)) return 'Use lowercase letters, numbers, and hyphens only'
  if (v.length > 80) return 'Slug is too long'
  if (isNumericOnly(v)) return 'Slug cannot be only numbers'
  return null
}

export function validateServiceTitle(value: string): ValidationResult {
  const required = validateRequired(value, 'Service title', 2, 120)
  if (required) return required
  const v = trim(value)
  if (isNumericOnly(v)) return 'Service title cannot be only numbers'
  if (!hasLetters(v)) return 'Service title must include letters'
  return null
}

export function validateServiceDescription(value: string): ValidationResult {
  const v = trim(value)
  if (!v) return null
  if (v.length > 500) return 'Service description must be at most 500 characters'
  if (isNumericOnly(v)) return 'Description cannot be only numbers'
  return null
}

export function validateCategoryName(value: string): ValidationResult {
  const required = validateRequired(value, 'Category name', 2, 80)
  if (required) return required
  const v = trim(value)
  if (isNumericOnly(v)) return 'Category name cannot be only numbers'
  if (!hasLetters(v)) return 'Category name must include letters'
  return null
}

export function validateTestimonialContent(value: string): ValidationResult {
  const required = validateRequired(value, 'Testimonial', 10, 1000)
  if (required) return required
  if (isNumericOnly(trim(value))) return 'Testimonial cannot be only numbers'
  if (!hasLetters(trim(value))) return 'Testimonial must include text'
  return null
}

export function validateClientName(value: string): ValidationResult {
  return validateName(value, 'Client name')
}

export function validateServiceType(value: string): ValidationResult {
  const v = trim(value)
  if (!v) return null
  if (v.length > 80) return 'Service type is too long'
  if (isNumericOnly(v)) return 'Service type cannot be only numbers'
  if (!hasLetters(v)) return 'Service type must include letters'
  return null
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
