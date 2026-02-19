import { useCallback, useEffect, useRef } from 'react'
import { useEnvelopeStore } from '@/stores/envelope'
import { FIELD_ICONS } from '@/constants'
import type { EnvelopeField } from '@/types'
import styles from './DraggableField.module.css'

const RESIZABLE_TYPES = new Set([
  'text', 'number', 'note', 'list', 'formulaTab', 'attachmentTab',
])

const SCALABLE_TYPES = new Set(['signHere', 'initialHere', 'stampHere'])

type Corner = 'nw' | 'ne' | 'sw' | 'se'

interface Props {
  field: EnvelopeField
  scale: number
}

export default function DraggableField({ field, scale }: Props) {
  const updateField = useEnvelopeStore((s) => s.updateField)
  const selectField = useEnvelopeStore((s) => s.selectField)
  const removeField = useEnvelopeStore((s) => s.removeField)
  const duplicateField = useEnvelopeStore((s) => s.duplicateField)
  const selectedFieldId = useEnvelopeStore((s) => s.selectedFieldId)
  const getRecipientColor = useEnvelopeStore((s) => s.getRecipientColor)

  const isSelected = selectedFieldId === field.id
  const color = getRecipientColor(field.recipientId)
  const canResize = RESIZABLE_TYPES.has(field.type)
  const isScalable = SCALABLE_TYPES.has(field.type)
  const scalePercent = field.scaleValue ?? 100

  // Drag state
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, fieldX: 0, fieldY: 0 })

  // Resize state
  const resizing = useRef(false)
  const resizeCorner = useRef<Corner>('se')
  const resizeStart = useRef({ x: 0, y: 0, fieldX: 0, fieldY: 0, fieldW: 0, fieldH: 0, scaleVal: 100 })

  // Refs for stable effect handlers
  const scaleRef = useRef(scale)
  scaleRef.current = scale
  const fieldRef = useRef(field)
  fieldRef.current = field

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      selectField(field.id)
      dragging.current = true
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        fieldX: field.x,
        fieldY: field.y,
      }
    },
    [field.id, field.x, field.y, selectField],
  )

  function onResizeMouseDown(e: React.MouseEvent, corner: Corner) {
    e.stopPropagation()
    e.preventDefault()
    resizing.current = true
    resizeCorner.current = corner
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      fieldX: field.x,
      fieldY: field.y,
      fieldW: field.width,
      fieldH: field.height,
      scaleVal: field.scaleValue ?? 100,
    }
  }

  useEffect(() => {
    if (!isSelected) return

    function onMouseMove(e: MouseEvent) {
      const s = scaleRef.current
      const f = fieldRef.current
      if (resizing.current) {
        const dx = (e.clientX - resizeStart.current.x) / s
        const dy = (e.clientY - resizeStart.current.y) / s
        const corner = resizeCorner.current
        const start = resizeStart.current
        const updates: Partial<EnvelopeField> = {}

        // Scalable types: corner drag adjusts scaleValue (aspect-ratio locked)
        if (SCALABLE_TYPES.has(f.type)) {
          // Use the dominant axis (whichever moved more proportionally)
          const dxRatio = dx / start.fieldW
          const dyRatio = dy / start.fieldH
          let ratio: number
          if (corner === 'se') ratio = Math.max(dxRatio, dyRatio)
          else if (corner === 'sw') ratio = Math.max(-dxRatio, dyRatio)
          else if (corner === 'ne') ratio = Math.max(dxRatio, -dyRatio)
          else ratio = Math.max(-dxRatio, -dyRatio) // nw

          const newScale = Math.min(200, Math.max(50, Math.round(start.scaleVal + ratio * start.scaleVal)))
          updates.scaleValue = newScale
        } else {
          if (corner === 'se') {
            updates.width = Math.max(20, start.fieldW + dx)
            updates.height = Math.max(14, start.fieldH + dy)
          } else if (corner === 'sw') {
            const newW = Math.max(20, start.fieldW - dx)
            updates.x = start.fieldX + start.fieldW - newW
            updates.width = newW
            updates.height = Math.max(14, start.fieldH + dy)
          } else if (corner === 'ne') {
            updates.width = Math.max(20, start.fieldW + dx)
            const newH = Math.max(14, start.fieldH - dy)
            updates.y = start.fieldY + start.fieldH - newH
            updates.height = newH
          } else if (corner === 'nw') {
            const newW = Math.max(20, start.fieldW - dx)
            const newH = Math.max(14, start.fieldH - dy)
            updates.x = start.fieldX + start.fieldW - newW
            updates.y = start.fieldY + start.fieldH - newH
            updates.width = newW
            updates.height = newH
          }
        }

        updateField(f.id, updates)
        return
      }
      if (!dragging.current) return
      const dx = (e.clientX - dragStart.current.x) / s
      const dy = (e.clientY - dragStart.current.y) / s
      updateField(fieldRef.current.id, {
        x: Math.max(0, dragStart.current.fieldX + dx),
        y: Math.max(0, dragStart.current.fieldY + dy),
      })
    }

    function onMouseUp() {
      dragging.current = false
      resizing.current = false
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [isSelected, updateField])

  // For scalable types, base dimensions are multiplied by scaleValue percentage
  const displayW = isScalable ? field.width * (scalePercent / 100) : field.width
  const displayH = isScalable ? field.height * (scalePercent / 100) : field.height

  return (
    <div
      className={`${styles.field} ${isSelected ? styles.selected : ''}`}
      style={{
        left: field.x * scale,
        top: field.y * scale,
        width: displayW * scale,
        height: displayH * scale,
        borderColor: color,
        backgroundColor: color + '20',
      }}
      onMouseDown={onMouseDown}
    >
      {isScalable ? (
        <div className={styles.signBlock}>
          <span className={styles.signLabel}>{field.label}</span>
          <span className={styles.signIcon}>✍️</span>
          <div className={styles.signLine} style={{ borderColor: color }} />
        </div>
      ) : (
        <>
          <span className={styles.icon}>{FIELD_ICONS[field.type]}</span>
          <span className={styles.label}>
            {field.type === 'list'
              ? (field.listItems ?? []).find((i) => i.value === field.value)?.text || 'Select'
              : field.label}
            {field.type === 'list' && <span className={styles.dropdownCaret}> ▾</span>}
          </span>
        </>
      )}

      {isSelected && (canResize || isScalable) && (
        <>
          <div className={`${styles.handle} ${styles.handleNW}`} style={{ borderColor: color }} onMouseDown={(e) => onResizeMouseDown(e, 'nw')} />
          <div className={`${styles.handle} ${styles.handleNE}`} style={{ borderColor: color }} onMouseDown={(e) => onResizeMouseDown(e, 'ne')} />
          <div className={`${styles.handle} ${styles.handleSW}`} style={{ borderColor: color }} onMouseDown={(e) => onResizeMouseDown(e, 'sw')} />
          <div className={`${styles.handle} ${styles.handleSE}`} style={{ borderColor: color }} onMouseDown={(e) => onResizeMouseDown(e, 'se')} />
        </>
      )}

      {isSelected && (
        <div className={styles.toolbar}>
          <button
            className={styles.toolBtn}
            title="Duplicate"
            onClick={(e) => {
              e.stopPropagation()
              duplicateField(field.id)
            }}
          >
            📋
          </button>
          <button
            className={`${styles.toolBtn} ${styles.deleteBtn}`}
            title="Delete"
            onClick={(e) => {
              e.stopPropagation()
              removeField(field.id)
            }}
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  )
}
