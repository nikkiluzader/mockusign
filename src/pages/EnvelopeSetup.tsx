import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEnvelopeStore, RECIPIENT_TYPES } from '@/stores/envelope'
import * as pdfjsLib from 'pdfjs-dist'
import type { RecipientType } from '@/types'
import TestCaseSidebar from '@/components/TestCaseSidebar'
import HelpModal from '@/components/HelpModal'
import styles from './EnvelopeSetup.module.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).href

export default function EnvelopeSetup() {
  const navigate = useNavigate()
  const store = useEnvelopeStore()
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'documents' | 'recipients' | 'message' | 'settings'>('documents')
  const [showHelp, setShowHelp] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canProceed =
    store.documents.length > 0 &&
    store.recipients.length > 0 &&
    store.recipients.every((r) => r.name && r.email)

  const handleFiles = useCallback(
    async (files: FileList) => {
      setUploading(true)
      for (const file of Array.from(files)) {
        if (file.type !== 'application/pdf') continue
        try {
          const arrayBuffer = await file.arrayBuffer()
          // Pass a copy to pdfjs (it transfers ownership), keep original for storage
          const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) }).promise
          const dataUrl = await fileToDataUrl(file)
          store.addDocument(file, dataUrl, pdf.numPages, arrayBuffer)
        } catch (err) {
          console.error('Error loading PDF:', err)
        }
      }
      setUploading(false)
    },
    [store],
  )

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer?.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  function proceed() {
    if (!canProceed) return
    if (!store.activeRecipientId && store.recipients.length > 0) {
      store.setActiveRecipient(store.recipients[0].id)
    }
    navigate('/editor')
  }

  return (
    <div className={styles.setupPage}>
      {/* Header */}
      <header className={styles.setupHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>✍</span>
            <span className={styles.logoText}>MockuSign</span>
            <button className={styles.helpBtn} onClick={() => setShowHelp(true)} title="About MockuSign">?</button>
          </div>
          <a className={styles.contactLink} href="mailto:nikkiluzader@gmail.com">
            Contact: nikkiluzader@gmail.com
          </a>
        </div>
        <div className={styles.headerCenter}>
          <div className={styles.steps}>
            <div className={`${styles.step} ${styles.active}`}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepLabel}>Set Up</span>
            </div>
            <div className={styles.stepDivider} />
            <div className={styles.step}>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepLabel}>Add Fields</span>
            </div>
            <div className={styles.stepDivider} />
            <div className={styles.step}>
              <span className={styles.stepNumber}>3</span>
              <span className={styles.stepLabel}>Export</span>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <button className="ds-btn ds-btn-yellow" disabled={!canProceed} onClick={proceed}>
            NEXT →
          </button>
        </div>
      </header>

      {/* Body with sidebar + main content */}
      <div className={styles.setupBody}>
        <TestCaseSidebar />

        {/* Main Content */}
        <div className={styles.setupContent}>
        {/* Tabs */}
        <div className={styles.setupTabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'documents' ? styles.active : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            📄 Documents ({store.documents.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'recipients' ? styles.active : ''}`}
            onClick={() => setActiveTab('recipients')}
          >
            👥 Recipients ({store.recipients.length})
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'message' ? styles.active : ''}`}
            onClick={() => setActiveTab('message')}
          >
            ✉️ Message
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Settings
          </button>
        </div>

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className={styles.tabContent}>
            <div
              className={`${styles.uploadZone} ${dragOver ? styles.dragOver : ''}`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className={styles.uploadIcon}>📁</div>
              <h3>Drag & drop PDF files here</h3>
              <p>or</p>
              <label className="ds-btn ds-btn-primary" style={{ marginTop: 8 }}>
                Browse Files
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  hidden
                  onChange={onFileSelect}
                />
              </label>
              {uploading && <p className={styles.uploadHint}>Loading...</p>}
            </div>

            {store.documents.length > 0 && (
              <div className={styles.documentList}>
                <h3>Uploaded Documents</h3>
                {store.documents.map((doc, idx) => (
                  <div key={doc.id} className={styles.documentItem}>
                    <div className={styles.docInfo}>
                      <span className={styles.docIcon}>📄</span>
                      <div>
                        <div className={styles.docName}>{doc.name}</div>
                        <div className={styles.docMeta}>
                          {doc.pageCount} page{doc.pageCount > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className={styles.docActions}>
                      <span className={styles.docOrder}>Document {idx + 1}</span>
                      <button
                        className={styles.removeBtn}
                        onClick={() => store.removeDocument(doc.id)}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recipients Tab */}
        {activeTab === 'recipients' && (
          <div className={styles.tabContent}>
            <div className={styles.recipientsHeader}>
              <h3>Add Recipients</h3>
              <button className="ds-btn ds-btn-primary" onClick={() => store.addRecipient()}>
                + Add Recipient
              </button>
            </div>

            {store.recipients.length === 0 && (
              <div className={styles.emptyState}>
                <p>No recipients added yet. Click "Add Recipient" to get started.</p>
              </div>
            )}

            {store.recipients.map((recipient, idx) => (
              <div key={recipient.id} className={styles.recipientCard}>
                <div className={styles.recipientHeader}>
                  <div
                    className={styles.recipientColor}
                    style={{ background: store.getRecipientColor(recipient.id) }}
                  >
                    {idx + 1}
                  </div>
                  <h4>Recipient {idx + 1}</h4>
                  <button
                    className={styles.removeBtn}
                    onClick={() => store.removeRecipient(recipient.id)}
                  >
                    ✕
                  </button>
                </div>
                <div className={styles.recipientForm}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className="ds-label">Name</label>
                      <input
                        className="ds-input"
                        value={recipient.name}
                        onChange={(e) =>
                          store.updateRecipient(recipient.id, { name: e.target.value })
                        }
                        placeholder="Recipient Name"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className="ds-label">Email</label>
                      <input
                        className="ds-input"
                        type="email"
                        value={recipient.email}
                        onChange={(e) =>
                          store.updateRecipient(recipient.id, { email: e.target.value })
                        }
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className="ds-label">Action</label>
                      <select
                        className="ds-select"
                        value={recipient.type}
                        onChange={(e) =>
                          store.updateRecipient(recipient.id, {
                            type: e.target.value as RecipientType,
                          })
                        }
                      >
                        {RECIPIENT_TYPES.map((rt) => (
                          <option key={rt.value} value={rt.value}>
                            {rt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className="ds-label">Signing Order</label>
                      <input
                        className="ds-input"
                        type="number"
                        min={1}
                        value={recipient.routingOrder}
                        onChange={(e) =>
                          store.updateRecipient(recipient.id, {
                            routingOrder: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message Tab */}
        {activeTab === 'message' && (
          <div className={styles.tabContent}>
            <div className={styles.messageSection}>
              <h3>Email Message</h3>
              <p className={styles.sectionDesc}>
                Customize the email that recipients will receive.
              </p>
              <div className={styles.formGroup} style={{ marginTop: 16 }}>
                <label className="ds-label">Email Subject</label>
                <input
                  className="ds-input"
                  value={store.emailSubject}
                  onChange={(e) => store.setEmailSubject(e.target.value)}
                  placeholder="Please sign this document"
                />
              </div>
              <div className={styles.formGroup} style={{ marginTop: 16 }}>
                <label className="ds-label">Email Message</label>
                <textarea
                  className="ds-input"
                  value={store.emailBlurb}
                  onChange={(e) => store.setEmailBlurb(e.target.value)}
                  placeholder="Optional message to include in the email..."
                  rows={6}
                  style={{ resize: 'vertical', minHeight: 120 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className={styles.tabContent}>
            {/* Envelope Status */}
            <div className={styles.settingsSection}>
              <h3>Envelope Status</h3>
              <p className={styles.sectionDesc}>
                Choose whether to send the envelope immediately or save it as a draft.
              </p>
              <div className={styles.statusToggle}>
                <button
                  className={`${styles.statusBtn} ${store.envelopeStatus === 'sent' ? styles.active : ''}`}
                  onClick={() => store.setEnvelopeStatus('sent')}
                >
                  <span className={styles.statusIcon}>📤</span>
                  <div>
                    <div className={styles.statusLabel}>Send</div>
                    <div className={styles.statusDesc}>Send to recipients immediately</div>
                  </div>
                </button>
                <button
                  className={`${styles.statusBtn} ${store.envelopeStatus === 'created' ? styles.active : ''}`}
                  onClick={() => store.setEnvelopeStatus('created')}
                >
                  <span className={styles.statusIcon}>📝</span>
                  <div>
                    <div className={styles.statusLabel}>Draft</div>
                    <div className={styles.statusDesc}>Save as draft for later</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Reminders */}
            <div className={styles.settingsSection}>
              <div className={styles.settingsHeader}>
                <div>
                  <h3>Reminders</h3>
                  <p className={styles.sectionDesc}>
                    Automatically remind recipients who haven't signed.
                  </p>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={store.reminderEnabled}
                    onChange={(e) => store.setReminderEnabled(e.target.checked)}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
              {store.reminderEnabled && (
                <div className={styles.settingsFields}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className="ds-label">First reminder after (days)</label>
                      <input
                        className="ds-input"
                        type="number"
                        min={1}
                        max={999}
                        value={store.reminderDelay}
                        onChange={(e) => store.setReminderDelay(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className="ds-label">Repeat every (days)</label>
                      <input
                        className="ds-input"
                        type="number"
                        min={1}
                        max={999}
                        value={store.reminderFrequency}
                        onChange={(e) => store.setReminderFrequency(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Expirations */}
            <div className={styles.settingsSection}>
              <div className={styles.settingsHeader}>
                <div>
                  <h3>Expiration</h3>
                  <p className={styles.sectionDesc}>
                    Set when the envelope expires if not completed.
                  </p>
                </div>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={store.expireEnabled}
                    onChange={(e) => store.setExpireEnabled(e.target.checked)}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
              {store.expireEnabled && (
                <div className={styles.settingsFields}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label className="ds-label">Expire after (days)</label>
                      <input
                        className="ds-input"
                        type="number"
                        min={1}
                        max={999}
                        value={store.expireAfter}
                        onChange={(e) => store.setExpireAfter(parseInt(e.target.value) || 120)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className="ds-label">Warn before expiry (days)</label>
                      <input
                        className="ds-input"
                        type="number"
                        min={0}
                        max={999}
                        value={store.expireWarn}
                        onChange={(e) => store.setExpireWarn(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      </div>{/* end setupBody */}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}
