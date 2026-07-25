import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Phone, Plus, Trash2 } from 'lucide-react'
import { EditableText } from '../cms/EditableText'
import { EditableAsset } from '../cms/EditableAsset'
import { useSiteContent } from '../../context/SiteContentContext'
import { useSectionFieldEdit } from '../../context/SectionEditContext'
import { useToast } from '../../context/ToastContext'
import { createStaffMember } from '../../lib/cmsTypes'
import { initStaffTreeReveal } from '../../animations/staffTreeReveal'
import { onIntroComplete, isIntroComplete } from '../../lib/intro'
import { Button } from '../ui/Button'
import './StaffShowcase.css'

export type StaffMember = {
  id: string
  name: string
  role: string
  phone: string
  image: string
}

type StaffSection = {
  eyebrow: string
  title: string
  titleEmphasis: string
  lead: string
  members: StaffMember[]
}

type AboutBlock = {
  staff?: StaffSection
}

function assetUrl(path: string) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) return path
  const base = import.meta.env.BASE_URL || '/'
  return `${base}${path.replace(/^\//, '')}`
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

function StaffNode({
  member,
  index,
  active,
  onSelect,
  variant,
  canEdit,
  onRemove,
}: {
  member: StaffMember
  index: number
  active: boolean
  onSelect: () => void
  variant: 'root' | 'branch'
  canEdit: boolean
  onRemove?: () => void
}) {
  return (
    <div
      className={[
        'staff-tree__node',
        `staff-tree__node--${variant}`,
        active ? 'staff-tree__node--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <button
        type="button"
        className="staff-tree__node-hit"
        onClick={onSelect}
        aria-pressed={active}
        aria-label={`${member.name}, ${member.role}`}
      >
        <div className="staff-tree__photo-wrap">
          {member.image ? (
            <img
              src={assetUrl(member.image)}
              alt=""
              className="staff-tree__photo"
              decoding="async"
              loading="eager"
            />
          ) : (
            <div className="staff-tree__photo staff-tree__photo--empty" aria-hidden />
          )}
        </div>

        <div className="staff-tree__copy">
          <span className="staff-tree__label">{variant === 'root' ? 'Leadership' : 'Team'}</span>
          <h3>
            <EditableText contentKey="about" path={`staff.members.${index}.name`} as="span" />
          </h3>
          <p className="staff-tree__role">
            <EditableText contentKey="about" path={`staff.members.${index}.role`} as="span" />
          </p>
          {member.phone || canEdit ? (
            member.phone ? (
              <a
                className="staff-tree__phone"
                href={telHref(member.phone)}
                onClick={(event) => event.stopPropagation()}
              >
                <Phone size={15} aria-hidden="true" />
                <EditableText contentKey="about" path={`staff.members.${index}.phone`} as="span" />
              </a>
            ) : (
              <p className="staff-tree__phone">
                <Phone size={15} aria-hidden="true" />
                <EditableText contentKey="about" path={`staff.members.${index}.phone`} as="span" />
              </p>
            )
          ) : null}
        </div>
      </button>

      {canEdit ? (
        <div className="staff-tree__node-tools">
          <EditableAsset
            contentKey="about"
            path={`staff.members.${index}.image`}
            value={member.image || ''}
            uploadFolder="staff"
            accept="image/jpeg,image/png,image/webp,image/gif"
            label="Change photo"
          />
          {onRemove ? (
            <button type="button" className="cms-editable__trigger" onClick={onRemove}>
              <Trash2 size={12} />
              Remove
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function StaffShowcase() {
  const { getBlock, updateField } = useSiteContent()
  const canEdit = useSectionFieldEdit()
  const { showToast } = useToast()
  const staff = getBlock<AboutBlock>('about').staff
  const members: StaffMember[] = staff?.members?.length ? staff.members : []
  const [activeId, setActiveId] = useState(members[0]?.id ?? '')
  const sectionRef = useRef<HTMLElement>(null)

  const persistMembers = async (next: StaffMember[], message: string) => {
    try {
      await updateField('about', 'staff.members', next)
      showToast(message)
    } catch {
      showToast('Could not save team members.', 'error')
    }
  }

  useEffect(() => {
    if (!members.some((member) => member.id === activeId)) {
      setActiveId(members[0]?.id ?? '')
    }
  }, [members, activeId])

  useEffect(() => {
    const section = sectionRef.current
    if (!section || !members.length) return

    let cleanup: (() => void) | undefined
    let cancelled = false

    const init = () => {
      if (cancelled) return
      cleanup?.()
      cleanup = initStaffTreeReveal(section)
    }

    if (isIntroComplete()) {
      const frame = window.requestAnimationFrame(init)
      return () => {
        cancelled = true
        window.cancelAnimationFrame(frame)
        cleanup?.()
      }
    }

    const removeIntroListener = onIntroComplete(init)
    const failsafe = window.setTimeout(init, 4200)

    return () => {
      cancelled = true
      window.clearTimeout(failsafe)
      removeIntroListener()
      cleanup?.()
    }
  }, [members.length])

  if (!members.length && !canEdit) return null

  const root = members[0]
  const branches = members.slice(1)

  return (
    <section ref={sectionRef} className="staff-tree" aria-labelledby="staff-showcase-title">
      <div className="container staff-tree__inner">
        <header className="staff-tree__header">
          <EditableText contentKey="about" path="staff.eyebrow" as="span" className="section-label" />
          <h2 id="staff-showcase-title" className="display-lg">
            <EditableText contentKey="about" path="staff.title" as="span" />{' '}
            <em className="text-gold">
              <EditableText contentKey="about" path="staff.titleEmphasis" as="span" />
            </em>
          </h2>
          <EditableText contentKey="about" path="staff.lead" as="p" className="staff-tree__lead" multiline />
        </header>

        {root ? (
          <div className="staff-tree__canvas" role="group" aria-label="Leadership tree">
            <svg className="staff-tree__svg" aria-hidden="true">
              <g className="staff-tree__paths" />
            </svg>

            <div className="staff-tree__root">
              <StaffNode
                member={root}
                index={0}
                variant="root"
                active={activeId === root.id}
                onSelect={() => setActiveId(root.id)}
                canEdit={canEdit}
                onRemove={
                  canEdit && members.length > 1
                    ? () =>
                        void persistMembers(
                          members.filter((row) => row.id !== root.id),
                          'Team member removed.',
                        )
                    : undefined
                }
              />
            </div>

            {branches.length > 0 ? (
              <>
                <div className="staff-tree__hub" aria-hidden="true" />
                <div
                  className="staff-tree__branches"
                  style={{ '--staff-branch-count': branches.length } as CSSProperties}
                >
                  {branches.map((member, branchIndex) => (
                    <StaffNode
                      key={member.id}
                      member={member}
                      index={branchIndex + 1}
                      variant="branch"
                      active={activeId === member.id}
                      onSelect={() => setActiveId(member.id)}
                      canEdit={canEdit}
                      onRemove={
                        canEdit
                          ? () =>
                              void persistMembers(
                                members.filter((row) => row.id !== member.id),
                                'Team member removed.',
                              )
                          : undefined
                      }
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
        ) : (
          <p className="staff-tree__empty">No team members yet. Add the first person below.</p>
        )}

        {canEdit ? (
          <div className="cms-list-edit__add">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void persistMembers([...members, createStaffMember()], 'Team member added — update name and photo.')}
            >
              <Plus size={14} />
              Add team member
            </Button>
            <p className="cms-list-edit__hint">
              Click section <strong>DONE</strong> when finished editing this team block.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
