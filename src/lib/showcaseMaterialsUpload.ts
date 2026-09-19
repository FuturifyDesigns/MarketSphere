import { supabase } from './supabase'

const MATERIAL_BUCKET = 'showcase-materials'
const MAX_MATERIAL_BYTES = 25 * 1024 * 1024

const ALLOWED_MATERIAL_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
])

const EXTENSION_TYPE_FALLBACKS: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
}

function safeFileName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 120) || 'material'
}

export function showcaseMaterialType(file: File) {
  if (file.type) return file.type
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return EXTENSION_TYPE_FALLBACKS[ext] || 'application/octet-stream'
}

export function assertShowcaseMaterialFile(file: File) {
  const type = showcaseMaterialType(file)
  if (!ALLOWED_MATERIAL_TYPES.has(type)) {
    throw new Error('Upload a PDF, Word, PowerPoint, Excel, or text document.')
  }
  if (file.size > MAX_MATERIAL_BYTES) {
    throw new Error('Learning material must be 25MB or smaller.')
  }
}

export async function uploadShowcaseMaterial(file: File, folder = 'general'): Promise<string> {
  assertShowcaseMaterialFile(file)
  const cleanFolder = safeFileName(folder)
  const cleanName = safeFileName(file.name)
  const path = `${cleanFolder}/${Date.now()}-${cleanName}`
  const contentType = showcaseMaterialType(file)
  const { error } = await supabase.storage.from(MATERIAL_BUCKET).upload(path, file, {
    upsert: false,
    contentType,
  })
  if (error) throw error
  const { data } = supabase.storage.from(MATERIAL_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
