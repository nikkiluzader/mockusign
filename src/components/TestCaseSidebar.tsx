import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEnvelopeStore } from '@/stores/envelope'
import * as pdfjsLib from 'pdfjs-dist'
import type { FieldType } from '@/types'
import styles from './TestCaseSidebar.module.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).href

interface FieldPlacement {
  type: FieldType
  recipientIndex: number // 0-based index into the recipients array
  page: number
  x: number
  y: number
}

interface RecipientDef {
  name: string
  email: string
  type: 'signers' | 'carbonCopies' | 'certifiedDeliveries' | 'inPersonSigners' | 'agents' | 'intermediaries'
}

interface TestCase {
  id: string
  name: string
  description: string
  icon: string
  emailSubject: string
  pdf: string // filename in /public
  status: 'created' | 'sent'
  reminderEnabled?: boolean
  reminderDelay?: number
  reminderFrequency?: number
  expireEnabled?: boolean
  expireAfter?: number
  expireWarn?: number
  recipients: RecipientDef[]
  fields: FieldPlacement[]
}

const TEST_CASES: TestCase[] = [
  {
    id: 'basic-signer',
    name: 'Basic Signature',
    description: 'Single signer, single-page PDF, sent immediately',
    icon: '✒️',
    emailSubject: 'Please sign this document',
    pdf: 'singlepage.pdf',
    status: 'sent',
    recipients: [
      { name: 'Alice Johnson', email: 'alice@example.com', type: 'signers' },
    ],
    fields: [
      { type: 'fullName', recipientIndex: 0, page: 1, x: 80, y: 460 },
      { type: 'emailAddress', recipientIndex: 0, page: 1, x: 300, y: 460 },
      { type: 'signHere', recipientIndex: 0, page: 1, x: 80, y: 500 },
      { type: 'dateSignedTabs', recipientIndex: 0, page: 1, x: 350, y: 510 },
    ],
  },
  {
    id: 'two-signers',
    name: 'Two Signers (Multi-Page)',
    description: '10-page PDF, two signers on different pages, daily reminders',
    icon: '👥',
    emailSubject: 'Contract for dual signature',
    pdf: 'tenpages.pdf',
    status: 'sent',
    reminderEnabled: true,
    reminderDelay: 2,
    reminderFrequency: 1,
    recipients: [
      { name: 'Bob Smith', email: 'bob@example.com', type: 'signers' },
      { name: 'Carol Davis', email: 'carol@example.com', type: 'signers' },
    ],
    fields: [
      { type: 'fullName', recipientIndex: 0, page: 1, x: 80, y: 120 },
      { type: 'emailAddress', recipientIndex: 0, page: 1, x: 300, y: 120 },
      { type: 'company', recipientIndex: 0, page: 1, x: 80, y: 160 },
      { type: 'text', recipientIndex: 0, page: 3, x: 80, y: 200 },
      { type: 'signHere', recipientIndex: 0, page: 5, x: 80, y: 500 },
      { type: 'dateSignedTabs', recipientIndex: 0, page: 5, x: 350, y: 510 },
      { type: 'fullName', recipientIndex: 1, page: 2, x: 80, y: 120 },
      { type: 'emailAddress', recipientIndex: 1, page: 2, x: 300, y: 120 },
      { type: 'company', recipientIndex: 1, page: 2, x: 80, y: 160 },
      { type: 'text', recipientIndex: 1, page: 7, x: 80, y: 200 },
      { type: 'signHere', recipientIndex: 1, page: 10, x: 80, y: 500 },
      { type: 'dateSignedTabs', recipientIndex: 1, page: 10, x: 350, y: 510 },
    ],
  },
  {
    id: 'form-fields',
    name: 'Form with Inputs',
    description: '10-page form with number, checkboxes, dropdown, radio - expires in 30 days',
    icon: '📝',
    emailSubject: 'Please complete this form',
    pdf: 'tenpages.pdf',
    status: 'sent',
    expireEnabled: true,
    expireAfter: 30,
    expireWarn: 5,
    recipients: [
      { name: 'Dave Wilson', email: 'dave@example.com', type: 'signers' },
      { name: 'Eve Manager', email: 'eve@example.com', type: 'carbonCopies' },
    ],
    fields: [
      { type: 'fullName', recipientIndex: 0, page: 1, x: 80, y: 120 },
      { type: 'emailAddress', recipientIndex: 0, page: 1, x: 300, y: 120 },
      { type: 'company', recipientIndex: 0, page: 1, x: 80, y: 170 },
      { type: 'title', recipientIndex: 0, page: 1, x: 300, y: 170 },
      { type: 'text', recipientIndex: 0, page: 2, x: 80, y: 100 },
      { type: 'text', recipientIndex: 0, page: 2, x: 80, y: 160 },
      { type: 'number', recipientIndex: 0, page: 2, x: 80, y: 220 },
      { type: 'checkboxGroup', recipientIndex: 0, page: 3, x: 80, y: 100 },
      { type: 'list', recipientIndex: 0, page: 3, x: 80, y: 160 },
      { type: 'radioGroup', recipientIndex: 0, page: 3, x: 80, y: 220 },
      { type: 'signHere', recipientIndex: 0, page: 10, x: 80, y: 500 },
      { type: 'dateSignedTabs', recipientIndex: 0, page: 10, x: 350, y: 510 },
    ],
  },
  {
    id: 'approval-flow',
    name: 'Approval Workflow',
    description: 'Author + approver + viewer, single-page, reminders every 3 days',
    icon: '👍',
    emailSubject: 'Approval required',
    pdf: 'singlepage.pdf',
    status: 'sent',
    reminderEnabled: true,
    reminderDelay: 1,
    reminderFrequency: 3,
    recipients: [
      { name: 'Frank Author', email: 'frank@example.com', type: 'signers' },
      { name: 'Grace Approver', email: 'grace@example.com', type: 'signers' },
      { name: 'Hank Viewer', email: 'hank@example.com', type: 'certifiedDeliveries' },
    ],
    fields: [
      { type: 'fullName', recipientIndex: 0, page: 1, x: 80, y: 100 },
      { type: 'signHere', recipientIndex: 0, page: 1, x: 80, y: 150 },
      { type: 'dateSignedTabs', recipientIndex: 0, page: 1, x: 350, y: 160 },
      { type: 'fullName', recipientIndex: 1, page: 1, x: 80, y: 320 },
      { type: 'approve', recipientIndex: 1, page: 1, x: 80, y: 370 },
      { type: 'decline', recipientIndex: 1, page: 1, x: 200, y: 370 },
      { type: 'note', recipientIndex: 1, page: 1, x: 80, y: 420 },
      { type: 'dateSignedTabs', recipientIndex: 1, page: 1, x: 350, y: 330 },
    ],
  },
  {
    id: 'kitchen-sink',
    name: 'Kitchen Sink (10 pages)',
    description: 'Every field type across pages, reminders + expiration enabled',
    icon: '🧪',
    emailSubject: 'Complete test of all field types',
    pdf: 'tenpages.pdf',
    status: 'sent',
    reminderEnabled: true,
    reminderDelay: 1,
    reminderFrequency: 2,
    expireEnabled: true,
    expireAfter: 60,
    expireWarn: 7,
    recipients: [
      { name: 'Ivy Tester', email: 'ivy@example.com', type: 'signers' },
      { name: 'Jack Reviewer', email: 'jack@example.com', type: 'signers' },
    ],
    fields: [
      { type: 'fullName', recipientIndex: 0, page: 1, x: 80, y: 100 },
      { type: 'emailAddress', recipientIndex: 0, page: 1, x: 300, y: 100 },
      { type: 'company', recipientIndex: 0, page: 1, x: 80, y: 150 },
      { type: 'title', recipientIndex: 0, page: 1, x: 300, y: 150 },
      { type: 'text', recipientIndex: 0, page: 2, x: 80, y: 100 },
      { type: 'text', recipientIndex: 0, page: 2, x: 80, y: 160 },
      { type: 'checkboxGroup', recipientIndex: 0, page: 3, x: 80, y: 100 },
      { type: 'list', recipientIndex: 0, page: 3, x: 80, y: 160 },
      { type: 'radioGroup', recipientIndex: 0, page: 4, x: 80, y: 100 },
      { type: 'note', recipientIndex: 0, page: 5, x: 80, y: 100 },
      { type: 'number', recipientIndex: 0, page: 5, x: 80, y: 200 },
      { type: 'formulaTab', recipientIndex: 0, page: 6, x: 80, y: 100 },
      { type: 'attachmentTab', recipientIndex: 0, page: 7, x: 80, y: 100 },
      { type: 'initialHere', recipientIndex: 0, page: 8, x: 80, y: 100 },
      { type: 'signHere', recipientIndex: 0, page: 9, x: 80, y: 500 },
      { type: 'dateSignedTabs', recipientIndex: 0, page: 9, x: 350, y: 510 },
      { type: 'fullName', recipientIndex: 1, page: 10, x: 80, y: 100 },
      { type: 'emailAddress', recipientIndex: 1, page: 10, x: 300, y: 100 },
      { type: 'approve', recipientIndex: 1, page: 10, x: 80, y: 200 },
      { type: 'decline', recipientIndex: 1, page: 10, x: 200, y: 200 },
      { type: 'signHere', recipientIndex: 1, page: 10, x: 80, y: 400 },
      { type: 'dateSignedTabs', recipientIndex: 1, page: 10, x: 350, y: 410 },
      { type: 'note', recipientIndex: 1, page: 10, x: 80, y: 280 },
    ],
  },
  {
    id: 'draft-envelope',
    name: 'Draft Envelope',
    description: 'Saved as draft (status: created), single-page, no reminders',
    icon: '📋',
    emailSubject: 'Draft: Pending review',
    pdf: 'singlepage.pdf',
    status: 'created',
    recipients: [
      { name: 'Karen Drafter', email: 'karen@example.com', type: 'signers' },
    ],
    fields: [
      { type: 'fullName', recipientIndex: 0, page: 1, x: 80, y: 200 },
      { type: 'emailAddress', recipientIndex: 0, page: 1, x: 300, y: 200 },
      { type: 'text', recipientIndex: 0, page: 1, x: 80, y: 260 },
      { type: 'signHere', recipientIndex: 0, page: 1, x: 80, y: 500 },
      { type: 'dateSignedTabs', recipientIndex: 0, page: 1, x: 350, y: 510 },
    ],
  },
  {
    id: 'cc-with-reminders',
    name: 'CC + Aggressive Reminders',
    description: 'Signer + 2 CC recipients, daily reminders, expires in 14 days',
    icon: '📨',
    emailSubject: 'Urgent: Signature needed',
    pdf: 'singlepage.pdf',
    status: 'sent',
    reminderEnabled: true,
    reminderDelay: 1,
    reminderFrequency: 1,
    expireEnabled: true,
    expireAfter: 14,
    expireWarn: 3,
    recipients: [
      { name: 'Leo Signer', email: 'leo@example.com', type: 'signers' },
      { name: 'Mia Manager', email: 'mia@example.com', type: 'carbonCopies' },
      { name: 'Nina Legal', email: 'nina@example.com', type: 'carbonCopies' },
    ],
    fields: [
      { type: 'fullName', recipientIndex: 0, page: 1, x: 80, y: 150 },
      { type: 'company', recipientIndex: 0, page: 1, x: 300, y: 150 },
      { type: 'title', recipientIndex: 0, page: 1, x: 80, y: 200 },
      { type: 'text', recipientIndex: 0, page: 1, x: 300, y: 200 },
      { type: 'signHere', recipientIndex: 0, page: 1, x: 80, y: 450 },
      { type: 'initialHere', recipientIndex: 0, page: 1, x: 350, y: 450 },
      { type: 'dateSignedTabs', recipientIndex: 0, page: 1, x: 350, y: 500 },
    ],
  },
  {
    id: 'multi-role',
    name: 'Multi-Role Routing',
    description: '10-page, 4 recipients: signer, in-person, agent, CC - ordered routing',
    icon: '🔀',
    emailSubject: 'Multi-party agreement',
    pdf: 'tenpages.pdf',
    status: 'sent',
    reminderEnabled: true,
    reminderDelay: 3,
    reminderFrequency: 5,
    recipients: [
      { name: 'Oscar Primary', email: 'oscar@example.com', type: 'signers' },
      { name: 'Pam InPerson', email: 'pam@example.com', type: 'inPersonSigners' },
      { name: 'Quinn Agent', email: 'quinn@example.com', type: 'agents' },
      { name: 'Rita Copy', email: 'rita@example.com', type: 'carbonCopies' },
    ],
    fields: [
      { type: 'fullName', recipientIndex: 0, page: 1, x: 80, y: 100 },
      { type: 'emailAddress', recipientIndex: 0, page: 1, x: 300, y: 100 },
      { type: 'text', recipientIndex: 0, page: 1, x: 80, y: 150 },
      { type: 'signHere', recipientIndex: 0, page: 5, x: 80, y: 500 },
      { type: 'dateSignedTabs', recipientIndex: 0, page: 5, x: 350, y: 510 },
      { type: 'fullName', recipientIndex: 1, page: 2, x: 80, y: 100 },
      { type: 'signHere', recipientIndex: 1, page: 6, x: 80, y: 500 },
      { type: 'dateSignedTabs', recipientIndex: 1, page: 6, x: 350, y: 510 },
      { type: 'note', recipientIndex: 2, page: 10, x: 80, y: 100 },
    ],
  },
  {
    id: 'long-expiration-draft',
    name: 'Draft with Expiration',
    description: 'Draft, 10-page, number fields, long expiration (180 days), no reminders',
    icon: '⏰',
    emailSubject: 'Long-term agreement - draft',
    pdf: 'tenpages.pdf',
    status: 'created',
    expireEnabled: true,
    expireAfter: 180,
    expireWarn: 14,
    recipients: [
      { name: 'Sam Lawyer', email: 'sam@example.com', type: 'signers' },
      { name: 'Tina Counsel', email: 'tina@example.com', type: 'signers' },
    ],
    fields: [
      { type: 'fullName', recipientIndex: 0, page: 1, x: 80, y: 100 },
      { type: 'company', recipientIndex: 0, page: 1, x: 300, y: 100 },
      { type: 'text', recipientIndex: 0, page: 2, x: 80, y: 100 },
      { type: 'number', recipientIndex: 0, page: 2, x: 80, y: 160 },
      { type: 'initialHere', recipientIndex: 0, page: 3, x: 400, y: 500 },
      { type: 'signHere', recipientIndex: 0, page: 5, x: 80, y: 500 },
      { type: 'dateSignedTabs', recipientIndex: 0, page: 5, x: 350, y: 510 },
      { type: 'fullName', recipientIndex: 1, page: 6, x: 80, y: 100 },
      { type: 'company', recipientIndex: 1, page: 6, x: 300, y: 100 },
      { type: 'text', recipientIndex: 1, page: 7, x: 80, y: 100 },
      { type: 'initialHere', recipientIndex: 1, page: 8, x: 400, y: 500 },
      { type: 'signHere', recipientIndex: 1, page: 10, x: 80, y: 500 },
      { type: 'dateSignedTabs', recipientIndex: 1, page: 10, x: 350, y: 510 },
    ],
  },
  {
    id: 'minimal-fields',
    name: 'Minimal - Signature Only',
    description: 'Just a signature and date, single-page, no extras',
    icon: '✅',
    emailSubject: 'Quick signature needed',
    pdf: 'singlepage.pdf',
    status: 'sent',
    recipients: [
      { name: 'Uma Quick', email: 'uma@example.com', type: 'signers' },
    ],
    fields: [
      { type: 'signHere', recipientIndex: 0, page: 1, x: 80, y: 500 },
      { type: 'dateSignedTabs', recipientIndex: 0, page: 1, x: 350, y: 510 },
    ],
  },
]

export default function TestCaseSidebar() {
  const navigate = useNavigate()
  const store = useEnvelopeStore()
  const [loading, setLoading] = useState<string | null>(null)

  async function loadTestCase(tc: TestCase) {
    setLoading(tc.id)
    try {
      // Reset existing state
      store.reset()

      // Fetch the test PDF
      const response = await fetch(`/${tc.pdf}`)
      const arrayBuffer = await response.arrayBuffer()
      const file = new File([arrayBuffer], tc.pdf, { type: 'application/pdf' })

      // Get page count
      const pdfDoc = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer.slice(0)) }).promise
      const pageCount = pdfDoc.numPages

      // Create data URL
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })

      // Add document
      const doc = store.addDocument(file, dataUrl, pageCount, arrayBuffer)

      // Set email and envelope settings
      store.setEmailSubject(tc.emailSubject)
      store.setEnvelopeStatus(tc.status)
      if (tc.reminderEnabled !== undefined) store.setReminderEnabled(tc.reminderEnabled)
      if (tc.reminderDelay !== undefined) store.setReminderDelay(tc.reminderDelay)
      if (tc.reminderFrequency !== undefined) store.setReminderFrequency(tc.reminderFrequency)
      if (tc.expireEnabled !== undefined) store.setExpireEnabled(tc.expireEnabled)
      if (tc.expireAfter !== undefined) store.setExpireAfter(tc.expireAfter)
      if (tc.expireWarn !== undefined) store.setExpireWarn(tc.expireWarn)

      // Add recipients
      const recipientIds: string[] = []
      for (const rDef of tc.recipients) {
        const r = store.addRecipient()
        store.updateRecipient(r.id, {
          name: rDef.name,
          email: rDef.email,
          type: rDef.type,
        })
        recipientIds.push(r.id)
      }

      // Add fields - need to set activeRecipientId for each field
      for (const fp of tc.fields) {
        const rid = recipientIds[fp.recipientIndex]
        if (!rid) continue
        store.setActiveRecipient(rid)
        store.addField(fp.type, doc.id, fp.page, fp.x, fp.y)
      }

      // Set first recipient as active
      if (recipientIds.length > 0) {
        store.setActiveRecipient(recipientIds[0])
      }

      // Navigate to editor
      navigate('/editor')
    } catch (err) {
      console.error('Failed to load test case:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className={styles.sidebar}>
      <h3 className={styles.title}>🧪 Test Cases</h3>
      <p className={styles.subtitle}>Quick-load pre-configured scenarios</p>
      <div className={styles.cases}>
        {TEST_CASES.map((tc) => (
          <button
            key={tc.id}
            className={styles.caseBtn}
            onClick={() => loadTestCase(tc)}
            disabled={loading !== null}
          >
            <span className={styles.caseIcon}>{tc.icon}</span>
            <div className={styles.caseInfo}>
              <div className={styles.caseName}>
                {tc.name}
                {loading === tc.id && <span className={styles.spinner}>⏳</span>}
              </div>
              <div className={styles.caseDesc}>{tc.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
