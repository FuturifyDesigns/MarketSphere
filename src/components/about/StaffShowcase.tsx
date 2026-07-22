import { useEffect, useId, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { Phone } from 'lucide-react'
import { EditableText } from '../cms/EditableText'
import { useSiteContent } from '../../context/SiteContentContext'
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
}: {
  member: StaffMember
  index: number
  active: boolean
  onSelect: () => void
  variant: 'root' | 'branch'
}) {
  return (
    <motion.button
      type="button"
      className={[
        'staff-tree__node',
        `staff-tree__node--${variant}`,
        active ? 'staff-tree__node--active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`${member.name}, ${member.role}`}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.45, delay: variant === 'root' ? 0.05 : 0.12 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="staff-tree__photo-wrap">
        <img
          src={assetUrl(member.image)}
          alt=""
          className="staff-tree__photo"
          decoding="async"
          loading="lazy"
        />
      </div>

      <div className="staff-tree__copy">
        <span className="staff-tree__label">{variant === 'root' ? 'Leadership' : 'Team'}</span>
        <h3>
          <EditableText contentKey="about" path={`staff.members.${index}.name`} as="span" />
        </h3>
        <p className="staff-tree__role">
          <EditableText contentKey="about" path={`staff.members.${index}.role`} as="span" />
        </p>
        {member.phone ? (
          <a
            className="staff-tree__phone"
            href={telHref(member.phone)}
            onClick={(event) => event.stopPropagation()}
          >
            <Phone size={15} aria-hidden="true" />
            <EditableText contentKey="about" path={`staff.members.${index}.phone`} as="span" />
          </a>
        ) : null}
      </div>
    </motion.button>
  )
}

export function StaffShowcase() {
  const { getBlock } = useSiteContent()
  const staff = getBlock<AboutBlock>('about').staff
  const members: StaffMember[] = staff?.members?.length ? staff.members : []
  const [activeId, setActiveId] = useState(members[0]?.id ?? '')
  const treeId = useId()

  useEffect(() => {
    if (!members.some((member) => member.id === activeId)) {
      setActiveId(members[0]?.id ?? '')
    }
  }, [members, activeId])

  if (!members.length) return null

  const root = members[0]
  const branches = members.slice(1)

  return (
    <section className="staff-tree" aria-labelledby="staff-showcase-title">
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

        <div className="staff-tree__canvas" role="group" aria-label="Leadership tree">
          <svg className="staff-tree__svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id={`${treeId}-line`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-gold)" stopOpacity="0.85" />
                <stop offset="100%" stopColor="var(--color-gold)" stopOpacity="0.25" />
              </linearGradient>
            </defs>
            {branches.length > 0 ? (
              <>
                <path
                  className="staff-tree__path staff-tree__path--trunk"
                  d="M50 18 V48"
                  fill="none"
                  stroke={`url(#${treeId}-line)`}
                  strokeWidth="0.55"
                  vectorEffect="non-scaling-stroke"
                />
                <path
                  className="staff-tree__path staff-tree__path--arm"
                  d="M18 48 H82"
                  fill="none"
                  stroke={`url(#${treeId}-line)`}
                  strokeWidth="0.55"
                  vectorEffect="non-scaling-stroke"
                />
                {branches.map((_, branchIndex) => {
                  const x = branches.length === 1 ? 50 : 18 + (branchIndex * 64) / Math.max(branches.length - 1, 1)
                  return (
                    <path
                      key={branchIndex}
                      className="staff-tree__path staff-tree__path--drop"
                      d={`M${x} 48 V72`}
                      fill="none"
                      stroke={`url(#${treeId}-line)`}
                      strokeWidth="0.55"
                      vectorEffect="non-scaling-stroke"
                    />
                  )
                })}
              </>
            ) : null}
            <circle className="staff-tree__hub" cx="50" cy="48" r="1.4" />
          </svg>

          <div className="staff-tree__root">
            <StaffNode
              member={root}
              index={0}
              variant="root"
              active={activeId === root.id}
              onSelect={() => setActiveId(root.id)}
            />
          </div>

          {branches.length > 0 ? (
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
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
