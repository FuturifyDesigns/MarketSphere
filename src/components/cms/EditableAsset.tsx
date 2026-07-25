import { useRef, useState } from 'react'
import { Film, ImagePlus, Loader2 } from 'lucide-react'
import type { SiteContentKey } from '../../lib/siteContentDefaults'
import { uploadSiteAsset } from '../../lib/siteAssetUpload'
import { useSiteContent } from '../../context/SiteContentContext'
import { useSectionFieldEdit } from '../../context/SectionEditContext'
import { useToast } from '../../context/ToastContext'
import './cms.css'

type EditableAssetProps = {
  contentKey: SiteContentKey
  path: string
  value: string
  uploadFolder?: string
  accept?: string
  label?: string
  /** Large clickable photo zone for service/staff cards. */
  variant?: 'button' | 'dropzone'
  hint?: string
}

export function EditableAsset({
  contentKey,
  path,
  value,
  uploadFolder = 'media',
  accept = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm',
  label = 'Upload image or video',
  variant = 'button',
  hint,
}: EditableAssetProps) {
  const { updateField } = useSiteContent()
  const canEdit = useSectionFieldEdit()
  const { showToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  if (!canEdit) return null

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadSiteAsset(file, uploadFolder)
      await updateField(contentKey, path, url)
      showToast('Media updated — live for all visitors.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload media.'
      showToast(message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const isVideo = value.includes('video') || value.endsWith('.mp4') || value.endsWith('.webm')
  const icon = uploading ? (
    <Loader2 size={variant === 'dropzone' ? 22 : 16} className="spin" />
  ) : isVideo ? (
    <Film size={variant === 'dropzone' ? 22 : 16} />
  ) : (
    <ImagePlus size={variant === 'dropzone' ? 22 : 16} />
  )

  return (
    <div className={`cms-asset-edit${variant === 'dropzone' ? ' cms-asset-edit--dropzone' : ''}`}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="cms-image-edit__input"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        className={`cms-asset-edit__btn${variant === 'dropzone' ? ' cms-asset-edit__btn--dropzone' : ''}`}
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {icon}
        <span className="cms-asset-edit__label">{uploading ? 'Uploading…' : label}</span>
        {variant === 'dropzone' ? (
          <span className="cms-asset-edit__hint">
            {hint || 'JPEG, PNG or WebP · this is where the card photo goes'}
          </span>
        ) : null}
      </button>
      {value && variant !== 'dropzone' ? <code className="cms-asset-edit__path">{value}</code> : null}
    </div>
  )
}
