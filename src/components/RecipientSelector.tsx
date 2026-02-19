import { useEnvelopeStore } from '@/stores/envelope'
import styles from './RecipientSelector.module.css'

export default function RecipientSelector() {
  const recipients = useEnvelopeStore((s) => s.recipients)
  const activeRecipientId = useEnvelopeStore((s) => s.activeRecipientId)
  const setActiveRecipient = useEnvelopeStore((s) => s.setActiveRecipient)
  const getRecipientColor = useEnvelopeStore((s) => s.getRecipientColor)

  if (recipients.length === 0) return null

  return (
    <div className={styles.selector}>
      <label className={styles.label}>Assigning to:</label>
      <div className={styles.options}>
        {recipients.map((r, idx) => (
          <button
            key={r.id}
            className={`${styles.option} ${r.id === activeRecipientId ? styles.active : ''}`}
            onClick={() => setActiveRecipient(r.id)}
            style={
              r.id === activeRecipientId
                ? { borderColor: getRecipientColor(r.id), background: getRecipientColor(r.id) + '18' }
                : {}
            }
          >
            <span
              className={styles.dot}
              style={{ background: getRecipientColor(r.id) }}
            />
            <span className={styles.name}>{r.name || `Recipient ${idx + 1}`}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
