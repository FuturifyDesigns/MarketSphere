import { useRef, useState, type ImgHTMLAttributes } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'
import { useSiteContent } from '../../context/SiteContentContext'
import { useSectionFieldEdit } from '../../context/SectionEditContext'
import type { SiteContentKey } from '../../lib/siteContentDefaults'
import { uploadSiteAsset } from '../../lib/siteAssetUpload'
import { useToast } from '../../context/ToastContext'
import './cms.css'

type EditableImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  contentKey: SiteContentKey
  path: string
  src: string
  uploadFolder?: string
}

export function EditableImage({
  contentKey,
  path,
  src,
  uploadFolder = 'images',
  className = '',
  alt = '',
  ...imgProps
}: EditableImageProps) {
  const { updateField } = useSiteContent()
  const canEditField = useSectionFieldEdit()
  const { showToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadSiteAsset(file, uploadFolder)
      await updateField(contentKey, path, url)
      showToast('Image updated — live for all visitors.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not upload image.'
      showToast(message, 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={`cms-image-edit ${canEditField ? 'cms-image-edit--active' : ''}`}>
      <img src={src} alt={alt} className={className} {...imgProps} />
      {canEditField ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="cms-image-edit__input"
            onChange={(e) => void handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            className="cms-image-edit__overlay"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            aria-label="Change image"
          >
            <span>
              {uploading ? <Loader2 size={16} className="spin" /> : <ImagePlus size={16} />}
              {uploading ? 'Uploading…' : 'Change image'}
            </span>
          </button>
        </>
      ) : null}
    </div>
  )
}
