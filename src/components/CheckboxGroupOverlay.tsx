import { useEffect, useRef, useState } from 'react'
import { useEnvelopeStore } from '@/stores/envelope'
import type { EnvelopeField } from '@/types'
import styles from './CheckboxGroupOverlay.module.css'

const CB_SIZE = 20 // side length of each checkbox square

interface Props {
  field: EnvelopeField
  scale: number
}

export default function CheckboxGroupOverlay({ field, scale }: Props) {
  const updateField = useEnvelopeStore((s) => s.updateField)
  const selectField = useEnvelopeStore((s) => s.selectField)
  const removeField = useEnvelopeStore((s) => s.removeField)
  const selectedFieldId = useEnvelopeStore((s) => s.selectedFieldId)
  const getRecipientColor = useEnvelopeStore((s) => s.getRecipientColor)

  const isSelected = selectedFieldId === field.id
  const color = getRecipientColor(field.recipientId)
  const checkboxes = field.checkboxes ?? []

  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  // Refs for stable event handlers
  const checkboxesRef = useRef(field.checkboxes ?? [])
  checkboxesRef.current = field.checkboxes ?? []

  const scaleRef = useRef(scale)
  scaleRef.current = scale

  const dragging = useRef(false)
  const dragIdx = useRef<number>(-1)
  const dragStart = useRef({ x: 0, y: 0, cbX: 0, cbY: 0 })

  // Bounding box
  const PADDING = 12
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const cb of checkboxes) {
    const cx = field.x + cb.x
    const cy = field.y + cb.y
    if (cx < minX) minX = cx
    if (cy < minY) minY = cy
    if (cx + CB_SIZE > maxX) maxX = cx + CB_SIZE
    if (cy + CB_SIZE > maxY) maxY = cy + CB_SIZE
  }
  if (checkboxes.length === 0) {
    minX = field.x
    minY = field.y
    maxX = field.x + CB_SIZE
    maxY = field.y + CB_SIZE
  }
  const boxX = minX - PADDING
  const boxY = minY - PADDING
  const boxW = maxX - minX + PADDING * 2
  const boxH = maxY - minY + PADDING * 2

  function onCbMouseDown(e: React.MouseEvent, idx: number) {
    e.stopPropagation()
    e.preventDefault()
    selectField(field.id)
    setActiveIdx(idx)
    dragging.current = true
    dragIdx.current = idx
    const cb = checkboxesRef.current[idx]
    if (!cb) return
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      cbX: cb.x,
      cbY: cb.y,
    }
  }

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return
      const idx = dragIdx.current
      const s = scaleRef.current
      const dx = (e.clientX - dragStart.current.x) / s
      const dy = (e.clientY - dragStart.current.y) / s
      const cbs = [...checkboxesRef.current]
      if (!cbs[idx]) return
      cbs[idx] = {
        ...cbs[idx],
        x: Math.round(dragStart.current.cbX + dx),
        y: Math.round(dragStart.current.cbY + dy),
      }
      updateField(field.id, { checkboxes: cbs })
    }

    function onMouseUp() {
      dragging.current = false
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [field.id, updateField])

  function addCheckbox() {
    const cbs = [...(field.checkboxes ?? [])]
    const last = cbs[cbs.length - 1]
    const newY = last ? last.y + CB_SIZE + 8 : 0
    const newX = last ? last.x : 0
    cbs.push({
      x: newX,
      y: newY,
      value: `Check${cbs.length + 1}`,
      selected: false,
    })
    updateField(field.id, { checkboxes: cbs })
    setActiveIdx(cbs.length - 1)
  }

  function onBoxClick(e: React.MouseEvent) {
    e.stopPropagation()
    selectField(field.id)
  }

  return (
    <>
      {/* Dashed bounding box */}
      <div
        className={`${styles.boundingBox} ${isSelected ? styles.selected : ''}`}
        style={{
          left: boxX * scale,
          top: boxY * scale,
          width: boxW * scale,
          height: boxH * scale,
          borderColor: color,
        }}
        onClick={onBoxClick}
      >
        {isSelected && (
          <div className={styles.toolbar}>
            <button
              className={styles.toolBtn}
              title="Delete Group"
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

      {/* Individual checkbox squares */}
      {checkboxes.map((cb, idx) => {
        const isActive = isSelected && activeIdx === idx
        return (
          <div
            key={idx}
            className={`${styles.cbSquare} ${isActive ? styles.activeCb : ''}`}
            style={{
              left: (field.x + cb.x) * scale,
              top: (field.y + cb.y) * scale,
              width: CB_SIZE * scale,
              height: CB_SIZE * scale,
              borderColor: isActive ? color : color + '99',
              backgroundColor: isActive ? color + '30' : color + '15',
            }}
            onMouseDown={(e) => onCbMouseDown(e, idx)}
            title={cb.value}
          >
            {cb.selected && (
              <span
                className={styles.checkmark}
                style={{ color, fontSize: CB_SIZE * scale * 0.65 }}
              >
                ✓
              </span>
            )}
          </div>
        )
      })}

      {/* Add checkbox button */}
      {isSelected && (
        <button
          className={styles.addBtn}
          style={{
            left: (boxX + boxW / 2) * scale,
            top: (boxY + boxH) * scale + 2,
            borderColor: color,
            color: color,
          }}
          title="Add Checkbox"
          onClick={(e) => {
            e.stopPropagation()
            addCheckbox()
          }}
        >
          +
        </button>
      )}
    </>
  )
}
