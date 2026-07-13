import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { SiteContentKey } from '../../lib/siteContentDefaults'
import { useSectionFieldEdit } from '../../context/SectionEditContext'
import { EditableText } from './EditableText'
import './cms.css'

type EditableLinkProps = {
  contentKey: SiteContentKey
  labelPath: string
  to: string
  className?: string
  children?: ReactNode
}

export function EditableLink({
  contentKey,
  labelPath,
  to,
  className = '',
  children,
}: EditableLinkProps) {
  const canEditField = useSectionFieldEdit()

  if (canEditField) {
    return (
      <span className={`cms-editable-link ${className}`.trim()}>
        <EditableText contentKey={contentKey} path={labelPath} as="span" />
        {children}
      </span>
    )
  }

  return (
    <Link to={to} className={className}>
      <EditableText contentKey={contentKey} path={labelPath} as="span" />
      {children}
    </Link>
  )
}
