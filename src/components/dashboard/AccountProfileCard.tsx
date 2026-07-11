import { useState, type ChangeEvent } from 'react'
import { User } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { prepareAvatarImage } from '../../lib/imageUpload'
import { supabase, uploadPreparedFile } from '../../lib/supabase'
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
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return

    setError('')
    setUploading(true)

    try {
      const prepared = await prepareAvatarImage(file)
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
    }
  }

  return (
    <section className="dashboard-section account-profile-card">
      <h2><User size={18} /> My Profile</h2>
      <div className="account-profile-card__body">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="account-avatar" />
        ) : (
          <div className="account-avatar account-avatar--placeholder" aria-hidden="true">
            {initials(profile?.full_name, profile?.email)}
          </div>
        )}
        <div className="account-profile-card__meta">
          <strong>{profile?.full_name || 'Your account'}</strong>
          <span>{profile?.email}</span>
          {profile?.phone && <span>{profile.phone}</span>}
          <label className="account-profile-card__upload">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              disabled={uploading}
            />
            {uploading ? 'Uploading…' : 'Change photo'}
          </label>
          <small>Compressed to 256×256 max — free-tier friendly.</small>
          {error && <p className="account-profile-card__error">{error}</p>}
        </div>
      </div>
    </section>
  )
}
