import { useEffect, useRef, useState } from 'react'
import { useEnvelopeStore } from '@/stores/envelope'
import type { EnvelopeField } from '@/types'
import styles from './RadioGroupOverlay.module.css'

const RADIO_SIZE = 20 // diameter of each radio circle

interface Props {
  field: EnvelopeField
  scale: number
}

export default function RadioGroupOverlay({ field, scale }: Props) {
  const updateField = useEnvelopeStore((s) => s.updateField)
  const selectField = useEnvelopeStore((s) => s.selectField)
  const removeField = useEnvelopeStore((s) => s.removeField)
  const selectedFieldId = useEnvelopeStore((s) => s.selectedFieldId)
  const getRecipientColor = useEnvelopeStore((s) => s.getRecipientColor)

  const isSelected = selectedFieldId === field.id
  const color = getRecipientColor(field.recipientId)
  const radios = field.radios ?? []

  // Track which radio index is currently being edited/highlighted
  const [activeRadioIdx, setActiveRadioIdx] = useState<number | null>(null)

  // Keep a ref to the latest radios so the mousemove handler never reads stale data
  const radiosRef = useRef(field.radios ?? [])
  radiosRef.current = field.radios ?? []

  const scaleRef = useRef(scale)
  scaleRef.current = scale

  // Dragging state for individual radios
  const dragging = useRef(false)
  const dragRadioIdx = useRef<number>(-1)
  const dragStart = useRef({ x: 0, y: 0, radioX: 0, radioY: 0 })

  // Compute bounding box around all radios (in unscaled coords)
  const PADDING = 12
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const r of radios) {
    const rx = field.x + r.x
    const ry = field.y + r.y
    if (rx < minX) minX = rx
    if (ry < minY) minY = ry
    if (rx + RADIO_SIZE > maxX) maxX = rx + RADIO_SIZE
    if (ry + RADIO_SIZE > maxY) maxY = ry + RADIO_SIZE
  }
  if (radios.length === 0) {
    minX = field.x
    minY = field.y
    maxX = field.x + RADIO_SIZE
    maxY = field.y + RADIO_SIZE
  }
  const boxX = minX - PADDING
  const boxY = minY - PADDING
  const boxW = maxX - minX + PADDING * 2
  const boxH = maxY - minY + PADDING * 2

  function onRadioMouseDown(e: React.MouseEvent, idx: number) {
    e.stopPropagation()
    e.preventDefault()
    selectField(field.id)
    setActiveRadioIdx(idx)
    dragging.current = true
    dragRadioIdx.current = idx
    // Read position from the ref so we always get current values
    const radio = radiosRef.current[idx]
    if (!radio) return
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      radioX: radio.x,
      radioY: radio.y,
    }
  }

  // Stable mouse handlers - set up once and use refs for mutable data
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging.current) return
      const idx = dragRadioIdx.current
      const s = scaleRef.current
      const dx = (e.clientX - dragStart.current.x) / s
      const dy = (e.clientY - dragStart.current.y) / s
      const radios = [...radiosRef.current]
      if (!radios[idx]) return
      radios[idx] = {
        ...radios[idx],
        x: Math.round(dragStart.current.radioX + dx),
        y: Math.round(dragStart.current.radioY + dy),
      }
      updateField(field.id, { radios })
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

  function addRadio() {
    const radios = [...(field.radios ?? [])]
    // Place new radio below the last one (or at the origin if none)
    const lastRadio = radios[radios.length - 1]
    const newY = lastRadio ? lastRadio.y + RADIO_SIZE + 8 : 0
    const newX = lastRadio ? lastRadio.x : 0
    radios.push({
      x: newX,
      y: newY,
      value: `Radio${radios.length + 1}`,
      selected: false,
    })
    updateField(field.id, { radios })
    setActiveRadioIdx(radios.length - 1)
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
        {/* Toolbar when selected */}
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

      {/* Individual radio circles */}
      {radios.map((radio, idx) => {
        const isActive = isSelected && activeRadioIdx === idx
        return (
          <div
            key={idx}
            className={`${styles.radioCircle} ${isActive ? styles.activeRadio : ''} ${radio.selected ? styles.radioSelected : ''}`}
            style={{
              left: (field.x + radio.x) * scale,
              top: (field.y + radio.y) * scale,
              width: RADIO_SIZE * scale,
              height: RADIO_SIZE * scale,
              borderColor: isActive ? color : color + '99',
              backgroundColor: isActive ? color + '30' : color + '15',
            }}
            onMouseDown={(e) => onRadioMouseDown(e, idx)}
            title={radio.value}
          >
            <div
              className={styles.radioInner}
              style={{
                backgroundColor: radio.selected ? color : 'transparent',
                width: RADIO_SIZE * scale * 0.45,
                height: RADIO_SIZE * scale * 0.45,
              }}
            />
          </div>
        )
      })}

      {/* Add radio button */}
      {isSelected && (
        <button
          className={styles.addBtn}
          style={{
            left: (boxX + boxW / 2) * scale,
            top: (boxY + boxH) * scale + 2,
            borderColor: color,
            color: color,
          }}
          title="Add Radio"
          onClick={(e) => {
            e.stopPropagation()
            addRadio()
          }}
        >
          +
        </button>
      )}
    </>
  )
}
