import styles from './HelpModal.module.css'

interface Props {
  onClose: () => void
}

export default function HelpModal({ onClose }: Props) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>
            <span className={styles.logoIcon}>✍</span> About MockuSign
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.body}>
          <p className={styles.tagline}>
            A visual DocuSign envelope builder that exports API-ready JSON payloads.
          </p>

          <h3>How It Works</h3>
          <ol className={styles.steps}>
            <li>
              <strong>Upload PDFs</strong> — Drag-and-drop or browse for documents. Multiple
              documents are supported and appear as tabs in the editor.
            </li>
            <li>
              <strong>Add Recipients</strong> — Define up to 8 color-coded recipients: signers,
              CC, certified deliveries, in-person signers, agents, and intermediaries, each with
              name, email, and routing order.
            </li>
            <li>
              <strong>Configure Settings</strong> — Set envelope status (send or draft),
              reminders (delay &amp; frequency), and expiration (days &amp; warning).
            </li>
            <li>
              <strong>Place Fields</strong> — Drag 18 field types across four categories
              (Signature, Standard, Input, Other) onto PDF pages. Fields are
              color-coded to their assigned recipient.
            </li>
            <li>
              <strong>Edit Properties</strong> — Click any field to configure flags, position,
              size or scale, label, tooltip, default value, font, validation, conditional
              logic, and type-specific settings like radio/checkbox values or dropdown options.
            </li>
            <li>
              <strong>Export JSON</strong> — Generate a complete{' '}
              <code>POST /envelopes</code> payload compatible with the DocuSign eSignature REST
              API. Copy to clipboard or download as a file.
            </li>
          </ol>

          <h3>Field Types</h3>
          <div className={styles.fieldGrid}>
            <div>
              <strong>Signature</strong>
              <ul>
                <li>✍️ Sign — scalable (50–200%)</li>
                <li>✍️ Initial — scalable</li>
                <li>📅 Date Signed</li>
                <li>📍 Stamp — scalable</li>
              </ul>
            </div>
            <div>
              <strong>Standard</strong>
              <ul>
                <li>👤 Name</li>
                <li>✉️ Email</li>
                <li>🏢 Company</li>
                <li>💼 Title</li>
              </ul>
            </div>
            <div>
              <strong>Input</strong>
              <ul>
                <li>📝 Text — resizable, validation</li>
                <li>🔢 Number — resizable, validation</li>
                <li>☑️ Checkbox — group overlay</li>
                <li>📋 Dropdown — list/series editor</li>
                <li>🔘 Radio — group overlay</li>
              </ul>
            </div>
            <div>
              <strong>Other</strong>
              <ul>
                <li>📌 Note — resizable</li>
                <li>👍 Approve / 👎 Decline</li>
                <li>🧮 Formula — expression editor</li>
                <li>📎 Attachment — resizable</li>
              </ul>
            </div>
          </div>

          <h3>Field Interactions</h3>
          <ul className={styles.whyList}>
            <li>
              <strong>Drag to move</strong> — All fields can be repositioned on the page.
            </li>
            <li>
              <strong>Corner resize</strong> — Resizable types (text, number, note, list,
              formula, attachment) have corner handles for width/height.
            </li>
            <li>
              <strong>Scale resize</strong> — Signature, initial, and stamp fields resize via
              scale (50–200%), maintaining aspect ratio.
            </li>
            <li>
              <strong>Group overlays</strong> — Radio and checkbox groups let you drag
              individual items, add new ones with the + button, and delete the group.
            </li>
            <li>
              <strong>Toolbar</strong> — Selected fields show duplicate (📋) and delete (🗑️) buttons.
            </li>
          </ul>

          <h3>Test Cases</h3>
          <p>
            The Setup page sidebar includes 10 pre-built test scenarios — from a minimal
            signature-only envelope to a kitchen-sink test with every field type. Click
            any test case to auto-load a PDF, create recipients, place fields, and jump to
            the editor.
          </p>

          <h3>Why?</h3>
          <ul className={styles.whyList}>
            <li>
              <strong>API Development</strong> — Prototype envelope definitions visually instead
              of writing JSON by hand.
            </li>
            <li>
              <strong>Testing</strong> — Use built-in test cases to auto-generate envelopes
              with various field configurations.
            </li>
            <li>
              <strong>Learning</strong> — See how DocuSign tab types, recipient routing, and
              envelope structure map to the REST API.
            </li>
          </ul>
        </div>
        <div className={styles.footer}>
          <button className="ds-btn ds-btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
