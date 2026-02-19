import { useState } from 'react'
import { useEnvelopeStore } from '@/stores/envelope'
import styles from './ExportModal.module.css'

interface Props {
  onClose: () => void
}

export default function ExportModal({ onClose }: Props) {
  const generatePayload = useEnvelopeStore((s) => s.generatePayload)
  const [copied, setCopied] = useState(false)

  const payload = generatePayload()
  const json = JSON.stringify(payload, null, 2)

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  function download() {
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'envelope-payload.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Export Envelope Payload</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.body}>
          <p className={styles.desc}>
            This JSON payload is compatible with the DocuSign eSignature REST API
            <code>POST /envelopes</code> endpoint.
          </p>
          <pre className={styles.codeBlock}>
            <code>{json}</code>
          </pre>
        </div>
        <div className={styles.footer}>
          <button className="ds-btn" onClick={onClose}>
            Close
          </button>
          <button className="ds-btn ds-btn-primary" onClick={download}>
            📥 Download JSON
          </button>
          <button className="ds-btn ds-btn-yellow" onClick={copyToClipboard}>
            {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  )
}
