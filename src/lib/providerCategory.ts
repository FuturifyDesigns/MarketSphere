import { supabase } from './supabase'
import type { Category, Provider } from './types'

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'youth-empowerment': ['youth', 'young', 'mentor', 'empowerment', 'community', 'leadership'],
  'academic-tuition': ['tutor', 'tuition', 'academic', 'school', 'learner', 'student', 'grades', 'exam'],
  'platform-marketing': ['marketing', 'advertis', 'social media', 'platform', 'brand', 'promotion', 'campaign'],
  'real-estate': [
    'real estate',
    'property',
    'home',
    'house',
    'rent',
    'bedroom',
    'bed',
    'beds',
    'bedstore',
    'mattress',
    'furniture',
    'interior',
    'decor',
  ],
  entrepreneurship: ['entrepreneur', 'startup', 'enterprise', 'business development', 'sme'],
  'music-education': ['music', 'piano', 'guitar', 'vocal', 'instrument', 'choir'],
  'it-services': ['it ', 'computer', 'software', 'tech', 'digital', 'web', 'app', 'coding'],
  farming: ['farm', 'agriculture', 'crop', 'livestock', 'harvest', 'agri'],
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ')
}

export function inferProviderCategory(
  businessName: string,
  description: string,
  categories: Category[],
): Category | null {
  const text = normalizeText(`${businessName} ${description}`)
  if (!text.trim()) return null

  let best: { category: Category; score: number } | null = null

  for (const category of categories) {
    let score = 0
    const name = category.name.toLowerCase()
    const slugPhrase = category.slug.replace(/-/g, ' ')

    if (text.includes(name)) score += 4
    if (text.includes(slugPhrase)) score += 3
    if (category.description && text.includes(category.description.toLowerCase().slice(0, 24))) score += 2

    for (const keyword of CATEGORY_KEYWORDS[category.slug] || []) {
      if (text.includes(keyword)) score += 2
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { category, score }
    }
  }

  return best && best.score >= 2 ? best.category : null
}

export async function syncProviderPrimaryCategory(
  providerId: string,
  businessName: string,
  description: string,
  categories: Category[],
) {
  const matched = inferProviderCategory(businessName, description, categories)
  if (!matched) return null

  const { data: services } = await supabase
    .from('provider_services')
    .select('id, category_id, title')
    .eq('provider_id', providerId)

  const uncategorized = services?.find((service) => !service.category_id)
  const primary = uncategorized || services?.[0]

  if (primary) {
    if (primary.category_id === matched.id) return matched
    await supabase.from('provider_services').update({ category_id: matched.id }).eq('id', primary.id)
    return matched
  }

  await supabase.from('provider_services').insert({
    provider_id: providerId,
    title: businessName.trim() || 'General services',
    description: description.trim() || null,
    category_id: matched.id,
  })

  return matched
}

export function getProviderPrimaryCategory(provider: Provider) {
  const serviceWithCategory = provider.provider_services?.find((service) => service.categories)
  return serviceWithCategory?.categories ?? null
}

export function providerNeedsCategory(provider: Provider) {
  return !provider.provider_services?.some((service) => service.category_id)
}

export async function ensureProviderCategoryIfNeeded(
  provider: Provider,
  categories: Category[],
): Promise<Provider> {
  if (!providerNeedsCategory(provider)) return provider
  if (!provider.business_name?.trim() || (provider.description?.trim().length ?? 0) < 10) {
    return provider
  }

  await syncProviderPrimaryCategory(
    provider.id,
    provider.business_name,
    provider.description || '',
    categories,
  )

  const { data } = await supabase
    .from('providers')
    .select('*, provider_services(*, categories(*))')
    .eq('id', provider.id)
    .single()

  return data || provider
}
