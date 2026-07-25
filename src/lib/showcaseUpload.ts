import { supabase } from './supabase'
import { prepareSiteImage } from './imageUpload'

export async function uploadShowcaseImage(file: File, listingId = 'general'): Promise<string> {
  const prepared = await prepareSiteImage(file)
  const path = `${listingId}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('showcase-listings').upload(path, prepared, {
    cacheControl: '3600',
    upsert: false,
    contentType: 'image/jpeg',
  })
  if (error) throw error
  const { data } = supabase.storage.from('showcase-listings').getPublicUrl(path)
  return data.publicUrl
}
