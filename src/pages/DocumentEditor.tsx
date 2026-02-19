import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEnvelopeStore } from '@/stores/envelope'
import FieldPalette from '@/components/FieldPalette'
import RecipientSelector from '@/components/RecipientSelector'
import PdfViewer from '@/components/PdfViewer'
import FieldProperties from '@/components/FieldProperties'
import ExportModal from '@/components/ExportModal'
import HelpModal from '@/components/HelpModal'
import styles from './DocumentEditor.module.css'

export default function DocumentEditor() {
  const navigate = useNavigate()
  const documents = useEnvelopeStore((s) => s.documents)
  const activeDocumentId = useEnvelopeStore((s) => s.activeDocumentId)
  const setActiveDocument = useEnvelopeStore((s) => s.setActiveDocument)
  const fields = useEnvelopeStore((s) => s.fields)

  const [showExport, setShowExport] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className={styles.editorPage}>
      {/* Header */}
      <header className={styles.editorHeader}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>
            ← Back
          </button>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>✍</span>
            <span className={styles.logoText}>MockuSign</span>
            <button className={styles.helpBtn} onClick={() => setShowHelp(true)} title="About MockuSign">?</button>
          </div>
        </div>

        <div className={styles.headerCenter}>
          {/* Document tabs */}
          <div className={styles.docTabs}>
            {documents.map((doc, idx) => (
              <button
                key={doc.id}
                className={`${styles.docTab} ${doc.id === activeDocumentId ? styles.active : ''}`}
                onClick={() => setActiveDocument(doc.id)}
              >
                📄 {doc.name.length > 20 ? doc.name.substring(0, 20) + '…' : doc.name}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.headerRight}>
          <span className={styles.fieldCount}>
            {fields.length} field{fields.length !== 1 ? 's' : ''}
          </span>
          <button className="ds-btn ds-btn-yellow" onClick={() => setShowExport(true)}>
            📦 Export JSON
          </button>
        </div>
      </header>

      {/* Three-panel layout */}
      <div className={styles.editorBody}>
        <aside className={styles.leftSidebar}>
          <RecipientSelector />
          <FieldPalette />
        </aside>

        <main className={styles.center}>
          <PdfViewer />
        </main>

        <aside className={styles.rightSidebar}>
          <FieldProperties />
        </aside>
      </div>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  )
}
