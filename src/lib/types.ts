export type UserRole = 'customer' | 'provider' | 'admin'
export type ProviderStatus = 'pending' | 'approved' | 'rejected'
export type EnquiryStatus = 'new' | 'read' | 'replied' | 'closed'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: UserRole
  avatar_url: string | null
  banned_at: string | null
  ban_reason: string | null
  banned_by: string | null
  created_at: string
}

export type NotificationType =
  | 'enquiry_new'
  | 'enquiry_sent'
  | 'enquiry_updated'
  | 'enquiry_new_admin'
  | 'contact_new'
  | 'account_banned'
  | 'account_unbanned'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType | string
  title: string
  body: string
  link: string | null
  metadata: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  sort_order: number
}

export interface Provider {
  id: string
  user_id: string
  business_name: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  location: string | null
  contact_email: string | null
  contact_phone: string | null
  gallery_urls: string[]
  status: ProviderStatus
  created_at: string
  updated_at: string
  provider_services?: ProviderService[]
  profiles?: Profile
}

export interface ProviderService {
  id: string
  provider_id: string
  category_id: string | null
  title: string
  description: string | null
  categories?: Category
}

export interface Enquiry {
  id: string
  customer_id: string | null
  provider_id: string
  subject: string
  message: string
  status: EnquiryStatus
  created_at: string
  providers?: Provider
  profiles?: Profile
}

export interface Testimonial {
  id: string
  client_name: string
  content: string
  service_type: string | null
  rating: number | null
  approved: boolean
  user_id?: string | null
  avatar_url?: string | null
}

export interface Favorite {
  customer_id: string
  provider_id: string
  created_at: string
  providers?: Provider
}

export type ContactMessageStatus = 'new' | 'read' | 'replied' | 'closed'

export interface ContactMessage {
  id: string
  full_name: string
  email: string
  phone: string | null
  message: string
  status: ContactMessageStatus
  created_at: string
}
