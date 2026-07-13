import type { ReactNode } from 'react'
import type { SiteContentKey } from '../../lib/siteContentDefaults'
import { useSiteContent } from '../../context/SiteContentContext'
import { useSectionFieldEdit } from '../../context/SectionEditContext'
import { Button } from '../ui/Button'
import { EditableText } from './EditableText'
import './cms.css'

function readPath(block: Record<string, unknown>, path: string): string {
  let value: unknown = block
  for (const part of path.split('.')) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[part]
    }
  }
  return typeof value === 'string' ? value : ''
}

type EditableButtonProps = {
  contentKey: SiteContentKey
  labelPath: string
  hrefPath?: string
  to: string
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: ReactNode
}

export function EditableButton({
  contentKey,
  labelPath,
  hrefPath,
  to,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
}: EditableButtonProps) {
  const canEditField = useSectionFieldEdit()
  const { getBlock } = useSiteContent()
  const block = getBlock<Record<string, unknown>>(contentKey)
  const resolvedTo = hrefPath ? readPath(block, hrefPath) || to : to

  if (canEditField) {
    return (
      <span className="cms-editable-btn">
        <span className={`btn btn--${variant} btn--${size} btn--cms-preview ${className}`.trim()}>
          <EditableText contentKey={contentKey} path={labelPath} as="span" />
          {children}
        </span>
        {hrefPath ? (
          <label className="cms-editable-btn__href">
            <span>Link URL</span>
            <EditableText contentKey={contentKey} path={hrefPath} as="span" className="cms-editable-btn__href-value" />
          </label>
        ) : null}
      </span>
    )
  }

  return (
    <Button to={resolvedTo} variant={variant} size={size} className={className}>
      <EditableText contentKey={contentKey} path={labelPath} as="span" />
      {children}
    </Button>
  )
}
