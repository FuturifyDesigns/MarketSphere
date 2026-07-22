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
  try {
    const matched = inferProviderCategory(businessName, description, categories)
    if (!matched) return null

    const { data: services, error: servicesError } = await supabase
      .from('provider_services')
      .select('id, category_id, title')
      .eq('provider_id', providerId)

    if (servicesError) {
      console.error('[provider-category] list services', servicesError)
      return null
    }

    const uncategorized = services?.find((service) => !service.category_id)
    const primary = uncategorized || services?.[0]

    if (primary) {
      if (primary.category_id === matched.id) return matched
      const { error } = await supabase
        .from('provider_services')
        .update({ category_id: matched.id })
        .eq('id', primary.id)
      if (error) {
        console.error('[provider-category] update', error)
        return null
      }
      return matched
    }

    const { error } = await supabase.from('provider_services').insert({
      provider_id: providerId,
      title: businessName.trim() || 'General services',
      description: description.trim() || null,
      category_id: matched.id,
    })
    if (error) {
      console.error('[provider-category] insert', error)
      return null
    }

    return matched
  } catch (error) {
    console.error('[provider-category] sync threw', error)
    return null
  }
}

export function getProviderPrimaryCategory(provider: Provider) {
  const serviceWithCategory = provider.provider_services?.find((service) => service.categories)
  return serviceWithCategory?.categories ?? null
}

export function providerNeedsCategory(provider: Provider) {
  return !provider.provider_services?.some((service) => service.category_id)
}

/**
 * Public pages must stay read-only. Category sync runs only from provider save / admin flows
 * via syncProviderPrimaryCategory — never from browse/home traffic under load.
 */
export async function ensureProviderCategoryIfNeeded(
  provider: Provider,
  _categories?: Category[],
): Promise<Provider> {
  return provider
}
