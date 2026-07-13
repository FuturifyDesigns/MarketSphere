import { useRef, useState, type ChangeEvent } from 'react'
import { Camera, Mail, Phone, UserRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { assertImageFile } from '../../lib/imageCrop'
import { UPLOAD_LIMITS, prepareAvatarImage } from '../../lib/imageUpload'
import { supabase, uploadPreparedFile } from '../../lib/supabase'
import { ImageCropModal } from '../ui/ImageCropModal'
import './AccountProfileCard.css'

function initials(name: string | null | undefined, email: string | undefined) {
  if (name?.trim()) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('')
  }
  return email?.charAt(0).toUpperCase() || '?'
}

export function AccountProfileCard() {
  const { user, profile, refreshProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropOpen, setCropOpen] = useState(false)

  const handleFilePick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      assertImageFile(file)
      setError('')
      setCropFile(file)
      setCropOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open image')
    }
  }

  const handleCroppedUpload = async (croppedFile: File) => {
    if (!user) return

    setUploading(true)
    setError('')

    try {
      const prepared = await prepareAvatarImage(croppedFile)
      const url = await uploadPreparedFile('avatars', `${user.id}/avatar`, prepared)
      if (!url) throw new Error('Upload failed. Please try again.')

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: url })
        .eq('id', user.id)

      if (updateError) throw updateError
      await refreshProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload photo')
    } finally {
      setUploading(false)
      setCropFile(null)
    }
  }

  return (
    <>
      <section className="account-profile-card">
        <div className="account-profile-card__avatar-wrap">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="account-avatar" />
          ) : (
            <div className="account-avatar account-avatar--placeholder" aria-hidden="true">
              {initials(profile?.full_name, profile?.email)}
            </div>
          )}
          <button
            type="button"
            className="account-profile-card__camera"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Change profile photo"
          >
            <Camera size={16} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFilePick}
            hidden
          />
        </div>

        <div className="account-profile-card__content">
          <span className="account-profile-card__eyebrow">My profile</span>
          <h2>{profile?.full_name || 'Your account'}</h2>

          <ul className="account-profile-card__details">
            <li>
              <Mail size={16} aria-hidden="true" />
              <span>{profile?.email}</span>
            </li>
            {profile?.phone ? (
              <li>
                <Phone size={16} aria-hidden="true" />
                <span>{profile.phone}</span>
              </li>
            ) : null}
            <li>
              <UserRound size={16} aria-hidden="true" />
              <span>
                {profile?.role === 'provider'
                  ? 'Provider account'
                  : profile?.role === 'admin'
                    ? 'Admin account'
                    : 'Customer account'}
              </span>
            </li>
          </ul>

          <div className="account-profile-card__actions">
            <button
              type="button"
              className="account-profile-card__upload"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : 'Change photo'}
            </button>
            <small>
              Saved at up to {UPLOAD_LIMITS.avatar.maxWidth}×{UPLOAD_LIMITS.avatar.maxHeight} px
            </small>
          </div>

          {error ? <p className="account-profile-card__error">{error}</p> : null}
        </div>
      </section>

      <ImageCropModal
        file={cropFile}
        open={cropOpen}
        title="Edit profile photo"
        outputSize={UPLOAD_LIMITS.avatar.maxWidth}
        onClose={() => {
          setCropOpen(false)
          setCropFile(null)
        }}
        onConfirm={(file) => void handleCroppedUpload(file)}
      />
    </>
  )
}
