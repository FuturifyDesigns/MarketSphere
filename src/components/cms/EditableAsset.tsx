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
}

export function EditableAsset({
  contentKey,
  path,
  value,
  uploadFolder = 'media',
  accept = 'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm',
  label = 'Upload image or video',
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

  return (
    <div className="cms-asset-edit">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="cms-image-edit__input"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <button
        type="button"
        className="cms-asset-edit__btn"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? <Loader2 size={16} className="spin" /> : value.includes('video') || value.endsWith('.mp4') ? <Film size={16} /> : <ImagePlus size={16} />}
        {uploading ? 'Uploading…' : label}
      </button>
      {value ? <code className="cms-asset-edit__path">{value}</code> : null}
    </div>
  )
}
