import { useCallback } from 'react'
import { useEnvelopeStore, FIELD_TYPES } from '@/stores/envelope'
import { FIELD_ICONS } from '@/constants'
import type { FieldCategory, FieldType } from '@/types'
import styles from './FieldPalette.module.css'

const CATEGORIES: { key: FieldCategory; label: string }[] = [
  { key: 'signature', label: 'Signature' },
  { key: 'standard', label: 'Standard' },
  { key: 'input', label: 'Input' },
  { key: 'other', label: 'Other' },
]

export default function FieldPalette() {
  const activeRecipientId = useEnvelopeStore((s) => s.activeRecipientId)

  const onDragStart = useCallback(
    (e: React.DragEvent, fieldType: FieldType) => {
      e.dataTransfer.setData('fieldType', fieldType)
      e.dataTransfer.effectAllowed = 'copy'
    },
    [],
  )

  return (
    <div className={styles.palette}>
      <h3 className={styles.title}>Fields</h3>
      {!activeRecipientId && (
        <p className={styles.hint}>Select a recipient first to add fields.</p>
      )}
      {activeRecipientId &&
        CATEGORIES.map((cat) => {
          const items = FIELD_TYPES.filter((f) => f.category === cat.key)
          return (
            <div key={cat.key} className={styles.category}>
              <h4 className={styles.catLabel}>{cat.label}</h4>
              <div className={styles.fieldGrid}>
                {items.map((ft) => (
                  <div
                    key={ft.type}
                    className={styles.fieldItem}
                    draggable
                    onDragStart={(e) => onDragStart(e, ft.type)}
                  >
                    <span className={styles.fieldIcon}>{FIELD_ICONS[ft.type]}</span>
                    <span className={styles.fieldLabel}>{ft.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
    </div>
  )
}
