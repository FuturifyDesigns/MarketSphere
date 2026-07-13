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

  return (
    <span className="cms-editable-btn">
      <Button
        to={resolvedTo}
        variant={variant}
        size={size}
        className={`${className} ${canEditField ? 'btn--cms-static' : ''}`.trim()}
        aria-disabled={canEditField || undefined}
        onClick={
          canEditField
            ? (event) => {
                event.preventDefault()
                event.stopPropagation()
              }
            : undefined
        }
      >
        <EditableText contentKey={contentKey} path={labelPath} as="span" />
        {children}
      </Button>
      {canEditField && hrefPath ? (
        <label className="cms-editable-btn__href">
          <span>Link URL</span>
          <EditableText contentKey={contentKey} path={hrefPath} as="span" className="cms-editable-btn__href-value" />
        </label>
      ) : null}
    </span>
  )
}
