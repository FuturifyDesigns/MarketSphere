import type { ElementType, KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { useSiteContent } from '../../context/SiteContentContext'
import { useCmsTextEditor } from '../../context/CmsTextEditorContext'
import { useSectionFieldEdit } from '../../context/SectionEditContext'
import type { SiteContentKey } from '../../lib/siteContentDefaults'
import './cms.css'

type EditableTextProps = {
  contentKey: SiteContentKey
  path: string
  as?: ElementType
  className?: string
  multiline?: boolean
  children?: ReactNode
}

function readDisplayValue(block: Record<string, unknown>, path: string): string {
  let value: unknown = block
  for (const part of path.split('.')) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[part]
    }
  }
  return typeof value === 'string' ? value : ''
}

export function EditableText({
  contentKey,
  path,
  as: Tag = 'span',
  className = '',
  multiline = false,
  children,
}: EditableTextProps) {
  const { getBlock } = useSiteContent()
  const canEditField = useSectionFieldEdit()
  const { openField, isFieldActive } = useCmsTextEditor()

  const display = readDisplayValue(getBlock<Record<string, unknown>>(contentKey), path)
  const isActive = isFieldActive(contentKey, path)

  const startEdit = (event: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => {
    if (!canEditField) return
    event.preventDefault()
    event.stopPropagation()
    openField({
      contentKey,
      path,
      multiline,
      anchor: event.currentTarget,
    })
  }

  const lines = display.split('\n')
  const content =
    children ??
    (lines.length > 1
      ? lines.map((line, index) => (
          <span key={index}>
            {line}
            {index < lines.length - 1 ? <br /> : null}
          </span>
        ))
      : display)

  return (
    <Tag
      className={`cms-editable ${canEditField ? 'cms-editable--active cms-editable--clickable' : ''} ${isActive ? 'cms-editable--editing' : ''} ${className}`.trim()}
      onClick={canEditField ? startEdit : undefined}
      onKeyDown={
        canEditField
          ? (event: KeyboardEvent<HTMLElement>) => {
              if (event.key === 'Enter' || event.key === ' ') startEdit(event)
            }
          : undefined
      }
      role={canEditField ? 'button' : undefined}
      tabIndex={canEditField ? 0 : undefined}
      title={canEditField ? 'Click to edit' : undefined}
    >
      {content}
    </Tag>
  )
}
