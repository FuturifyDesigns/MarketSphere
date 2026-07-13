const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export function assertImageFile(file: File) {
  if (!ACCEPTED_TYPES.has(file.type)) {
    throw new Error('Use a JPEG, PNG, or WebP image')
  }
}

export async function urlToImageFile(url: string, fileName = 'image.jpg'): Promise<File> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('Could not load image for editing')
  const blob = await response.blob()
  if (!blob.type.startsWith('image/')) {
    throw new Error('Could not load image for editing')
  }
  return new File([blob], fileName, { type: blob.type, lastModified: Date.now() })
}

export function loadImageFile(file: File): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ image: img, objectUrl })
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read image file'))
    }
    img.src = objectUrl
  })
}

export interface CropTransform {
  scale: number
  rotation: number
  offsetX: number
  offsetY: number
}

export const CROP_VIEWPORT_SIZE = 300

export function getBaseCoverScale(img: HTMLImageElement, viewportSize: number) {
  return Math.max(viewportSize / img.width, viewportSize / img.height)
}

export async function exportCroppedSquare(
  img: HTMLImageElement,
  transform: CropTransform,
  outputSize: number,
  viewportSize = CROP_VIEWPORT_SIZE,
): Promise<Blob> {
  const temp = document.createElement('canvas')
  temp.width = viewportSize
  temp.height = viewportSize
  const tctx = temp.getContext('2d')
  if (!tctx) throw new Error('Could not prepare crop')

  const baseScale = getBaseCoverScale(img, viewportSize)
  const drawScale = baseScale * transform.scale

  tctx.clearRect(0, 0, viewportSize, viewportSize)
  tctx.save()
  tctx.translate(viewportSize / 2 + transform.offsetX, viewportSize / 2 + transform.offsetY)
  tctx.rotate((transform.rotation * Math.PI) / 180)
  tctx.scale(drawScale, drawScale)
  tctx.drawImage(img, -img.width / 2, -img.height / 2)
  tctx.restore()

  const output = document.createElement('canvas')
  output.width = outputSize
  output.height = outputSize
  const octx = output.getContext('2d')
  if (!octx) throw new Error('Could not export image')

  octx.drawImage(temp, 0, 0, viewportSize, viewportSize, 0, 0, outputSize, outputSize)

  return new Promise((resolve, reject) => {
    output.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image export failed'))),
      'image/jpeg',
      0.92,
    )
  })
}

export async function croppedBlobToFile(blob: Blob, fileName = 'avatar.jpg') {
  return new File([blob], fileName.endsWith('.jpg') ? fileName : `${fileName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}
