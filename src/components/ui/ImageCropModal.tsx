import { useCallback, useEffect, useRef, useState } from 'react'
import { RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react'
import {
  CROP_VIEWPORT_SIZE,
  exportCroppedRect,
  exportCroppedSquare,
  getBaseCoverScale,
  getBaseCoverScaleRect,
  getCropViewportSize,
  loadImageFile,
  type CropTransform,
} from '../../lib/imageCrop'
import { Button } from './Button'
import './ImageCropModal.css'

interface ImageCropModalProps {
  file: File | null
  open: boolean
  title?: string
  outputSize?: number
  outputWidth?: number
  outputHeight?: number
  aspectRatio?: number
  onClose: () => void
  onConfirm: (file: File) => void
}

const DEFAULT_TRANSFORM: CropTransform = {
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
}

export function ImageCropModal({
  file,
  open,
  title = 'Edit photo',
  outputSize = 256,
  outputWidth,
  outputHeight,
  aspectRatio = 1,
  onClose,
  onConfirm,
}: ImageCropModalProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loadError, setLoadError] = useState('')
  const [transform, setTransform] = useState<CropTransform>(DEFAULT_TRANSFORM)
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 })
  const previewUrlRef = useRef<string | null>(null)

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!open || !file) {
      revokePreviewUrl()
      setImage(null)
      setPreviewUrl(null)
      setLoadError('')
      setTransform(DEFAULT_TRANSFORM)
      return
    }

    let cancelled = false
    revokePreviewUrl()
    setLoadError('')

    void loadImageFile(file)
      .then(({ image: loadedImage, objectUrl }) => {
        if (cancelled) {
          URL.revokeObjectURL(objectUrl)
          return
        }
        previewUrlRef.current = objectUrl
        setImage(loadedImage)
        setPreviewUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load this image. Try another file.')
      })

    return () => {
      cancelled = true
      revokePreviewUrl()
    }
  }, [open, file, revokePreviewUrl])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const updateTransform = useCallback((patch: Partial<CropTransform>) => {
    setTransform((prev) => ({ ...prev, ...patch }))
  }, [])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!image) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: transform.offsetX,
      offsetY: transform.offsetY,
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    updateTransform({
      offsetX: dragStart.current.offsetX + (e.clientX - dragStart.current.x),
      offsetY: dragStart.current.offsetY + (e.clientY - dragStart.current.y),
    })
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
  }

  const handleApply = async () => {
    if (!image || !file) return
    setLoading(true)
    try {
      const viewport = getCropViewportSize(aspectRatio, CROP_VIEWPORT_SIZE)
      const finalWidth = outputWidth ?? outputSize
      const finalHeight = outputHeight ?? (aspectRatio === 1 ? outputSize : Math.round(finalWidth / aspectRatio))
      const blob =
        aspectRatio === 1
          ? await exportCroppedSquare(image, transform, outputSize)
          : await exportCroppedRect(
              image,
              transform,
              finalWidth,
              finalHeight,
              viewport.width,
              viewport.height,
            )
      const cropped = new File([blob], file.name.endsWith('.jpg') ? file.name : 'photo.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now(),
      })
      onConfirm(cropped)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  if (!open || !file) return null

  const viewport = getCropViewportSize(aspectRatio, CROP_VIEWPORT_SIZE)
  const baseScale = image
    ? aspectRatio === 1
      ? getBaseCoverScale(image, CROP_VIEWPORT_SIZE)
      : getBaseCoverScaleRect(image, viewport.width, viewport.height)
    : 1
  const drawScale = baseScale * transform.scale
  const isWide = aspectRatio > 1

  return (
    <div className="image-crop-modal" role="dialog" aria-modal="true" aria-labelledby="image-crop-title">
      <button type="button" className="image-crop-modal__backdrop" aria-label="Close" onClick={onClose} />
      <div className={`image-crop-modal__panel${isWide ? ' image-crop-modal__panel--wide' : ''}`}>
        <header className="image-crop-modal__header">
          <h2 id="image-crop-title">{title}</h2>
          <button type="button" className="image-crop-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div
          className={`image-crop-modal__viewport${dragging ? ' image-crop-modal__viewport--dragging' : ''}${isWide ? ' image-crop-modal__viewport--wide' : ''}`}
          style={isWide ? { width: viewport.width, height: viewport.height } : undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="image-crop-modal__frame" aria-hidden="true" />
          {loadError ? (
            <p className="image-crop-modal__loading">{loadError}</p>
          ) : previewUrl && image ? (
            <img
              src={previewUrl}
              alt=""
              className="image-crop-modal__image"
              draggable={false}
              style={{
                transform: `translate(calc(-50% + ${transform.offsetX}px), calc(-50% + ${transform.offsetY}px)) rotate(${transform.rotation}deg) scale(${drawScale})`,
              }}
            />
          ) : (
            <p className="image-crop-modal__loading">Loading image…</p>
          )}
        </div>

        <div className="image-crop-modal__controls">
          <div className="image-crop-modal__control-row">
            <button
              type="button"
              className="image-crop-modal__icon-btn"
              onClick={() => updateTransform({ rotation: transform.rotation - 90 })}
              aria-label="Rotate left"
            >
              <RotateCcw size={18} />
            </button>
            <button
              type="button"
              className="image-crop-modal__icon-btn"
              onClick={() => updateTransform({ rotation: transform.rotation + 90 })}
              aria-label="Rotate right"
            >
              <RotateCw size={18} />
            </button>
            <label className="image-crop-modal__zoom">
              <ZoomOut size={16} aria-hidden="true" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={transform.scale}
                onChange={(e) => updateTransform({ scale: Number(e.target.value) })}
                aria-label="Zoom"
              />
              <ZoomIn size={16} aria-hidden="true" />
            </label>
          </div>
          <p className="image-crop-modal__hint">Drag to reposition · Rotate and zoom to frame your photo</p>
        </div>

        <footer className="image-crop-modal__footer">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleApply()} disabled={!image || loading}>
            {loading ? 'Saving…' : 'Apply photo'}
          </Button>
        </footer>
      </div>
    </div>
  )
}
