/** Client-side image prep for uploads. */

export const UPLOAD_LIMITS = {
  avatar: { maxWidth: 256, maxHeight: 256, maxBytes: 150_000, quality: 0.82 },
  logo: { maxWidth: 512, maxHeight: 512, maxBytes: 300_000, quality: 0.85 },
  gallery: { maxWidth: 1280, maxHeight: 1280, maxBytes: 500_000, quality: 0.8, maxCount: 6 },
} as const

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

type CompressOptions = {
  maxWidth: number
  maxHeight: number
  maxBytes: number
  quality: number
  fileName: string
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image file'))
    }
    img.src = url
  })
}

function fitDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image compression failed'))),
      type,
      quality,
    )
  })
}

async function compressImage(file: File, opts: CompressOptions): Promise<File> {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error('Use a JPEG, PNG, or WebP image')
  }

  const img = await loadImage(file)
  const { width, height } = fitDimensions(img.width, img.height, opts.maxWidth, opts.maxHeight)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not prepare image')

  ctx.drawImage(img, 0, 0, width, height)

  let quality = opts.quality
  let blob = await canvasToBlob(canvas, 'image/jpeg', quality)

  while (blob.size > opts.maxBytes && quality > 0.45) {
    quality -= 0.08
    blob = await canvasToBlob(canvas, 'image/jpeg', quality)
  }

  if (blob.size > opts.maxBytes) {
    throw new Error('Image is still too large after compression. Try a smaller photo.')
  }

  return new File([blob], opts.fileName.endsWith('.jpg') ? opts.fileName : `${opts.fileName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

export function prepareAvatarImage(file: File) {
  return compressImage(file, {
    ...UPLOAD_LIMITS.avatar,
    fileName: 'avatar.jpg',
  })
}

export function prepareLogoImage(file: File) {
  return compressImage(file, {
    ...UPLOAD_LIMITS.logo,
    fileName: 'logo.jpg',
  })
}

export function prepareGalleryImage(file: File) {
  return compressImage(file, {
    ...UPLOAD_LIMITS.gallery,
    fileName: `gallery-${crypto.randomUUID()}.jpg`,
  })
}
