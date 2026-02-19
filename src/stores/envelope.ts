import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { storeDocumentBinary, removeDocumentBinary, clearDocumentBinaries } from '@/stores/documentBinaryStore'
import type {
  RecipientTypeOption,
  Recipient,
  FieldTypeDefinition,
  EnvelopeField,
  EnvelopeDocument,
  FontColorOption,
  EnvelopePayload,
  PayloadTab,
  PayloadRecipient,
  PayloadNotification,
  FieldType,
} from '@/types'

// ── Constants ──

export const RECIPIENT_TYPES: RecipientTypeOption[] = [
  { value: 'signers', label: 'Needs to Sign' },
  { value: 'carbonCopies', label: 'Receives a Copy' },
  { value: 'certifiedDeliveries', label: 'Needs to View' },
  { value: 'inPersonSigners', label: 'In Person Signer' },
  { value: 'agents', label: 'Manages Envelope' },
  { value: 'intermediaries', label: 'Allow to Edit' },
]

export const FIELD_TYPES: FieldTypeDefinition[] = [
  { type: 'signHere', label: 'Sign', icon: 'pen-fancy', category: 'signature', defaultWidth: 74, defaultHeight: 44 },
  { type: 'initialHere', label: 'Initial', icon: 'pen', category: 'signature', defaultWidth: 50, defaultHeight: 40 },
  { type: 'dateSignedTabs', label: 'Date Signed', icon: 'calendar-check', category: 'signature', defaultWidth: 150, defaultHeight: 20 },
  { type: 'fullName', label: 'Name', icon: 'user', category: 'standard', defaultWidth: 150, defaultHeight: 20 },
  { type: 'emailAddress', label: 'Email', icon: 'envelope', category: 'standard', defaultWidth: 200, defaultHeight: 20 },
  { type: 'company', label: 'Company', icon: 'building', category: 'standard', defaultWidth: 150, defaultHeight: 20 },
  { type: 'title', label: 'Title', icon: 'briefcase', category: 'standard', defaultWidth: 150, defaultHeight: 20 },
  { type: 'text', label: 'Text', icon: 'font', category: 'input', defaultWidth: 150, defaultHeight: 20 },
  { type: 'number', label: 'Number', icon: 'hashtag', category: 'input', defaultWidth: 120, defaultHeight: 20 },
  { type: 'checkboxGroup', label: 'Checkbox', icon: 'square-check', category: 'input', defaultWidth: 20, defaultHeight: 20 },
  { type: 'list', label: 'Dropdown', icon: 'list', category: 'input', defaultWidth: 150, defaultHeight: 25 },
  { type: 'radioGroup', label: 'Radio', icon: 'circle-dot', category: 'input', defaultWidth: 20, defaultHeight: 20 },
  { type: 'note', label: 'Note', icon: 'sticky-note', category: 'other', defaultWidth: 200, defaultHeight: 60 },
  { type: 'approve', label: 'Approve', icon: 'thumbs-up', category: 'other', defaultWidth: 100, defaultHeight: 30 },
  { type: 'decline', label: 'Decline', icon: 'thumbs-down', category: 'other', defaultWidth: 100, defaultHeight: 30 },
  { type: 'formulaTab', label: 'Formula', icon: 'calculator', category: 'other', defaultWidth: 150, defaultHeight: 20 },
  { type: 'attachmentTab', label: 'Attachment', icon: 'paperclip', category: 'other', defaultWidth: 100, defaultHeight: 30 },
  { type: 'stampHere', label: 'Stamp', icon: 'stamp', category: 'signature', defaultWidth: 74, defaultHeight: 44 },
]

export const FONT_OPTIONS: string[] = [
  'Lucida Console', 'Arial', 'Courier New', 'Georgia', 'Helvetica',
  'Times New Roman', 'Trebuchet MS', 'Verdana',
]

export const FONT_SIZE_OPTIONS: number[] = [7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48]

export const FONT_COLOR_OPTIONS: FontColorOption[] = [
  { value: 'Black', label: 'Black' },
  { value: 'Blue', label: 'Blue' },
  { value: 'BrightBlue', label: 'Bright Blue' },
  { value: 'BrightRed', label: 'Bright Red' },
  { value: 'DarkGreen', label: 'Dark Green' },
  { value: 'DarkRed', label: 'Dark Red' },
  { value: 'Gold', label: 'Gold' },
  { value: 'Green', label: 'Green' },
  { value: 'NavyBlue', label: 'Navy Blue' },
  { value: 'Purple', label: 'Purple' },
  { value: 'White', label: 'White' },
]

const TAB_TYPE_MAP: Record<FieldType, string> = {
  signHere: 'signHereTabs',
  initialHere: 'initialHereTabs',
  dateSignedTabs: 'dateSignedTabs',
  fullName: 'fullNameTabs',
  emailAddress: 'emailAddressTabs',
  company: 'companyTabs',
  title: 'titleTabs',
  text: 'textTabs',
  number: 'numberTabs',
  checkbox: 'checkboxTabs',
  checkboxGroup: 'checkboxTabs',
  list: 'listTabs',
  radioGroup: 'radioGroupTabs',
  note: 'noteTabs',
  approve: 'approveTabs',
  decline: 'declineTabs',
  formulaTab: 'formulaTabs',
  attachmentTab: 'signerAttachmentTabs',
  stampHere: 'stampHereTabs',
}

const RECIPIENT_COLORS = [
  '#4C71BF', '#D95A2B', '#2FA44F', '#9B3AB1',
  '#E6A522', '#1A8BAF', '#D4456A', '#6B7B8D',
]

// ── Store Interface ──

interface EnvelopeState {
  emailSubject: string
  emailBlurb: string
  envelopeStatus: 'created' | 'sent'
  // Reminder settings
  reminderEnabled: boolean
  reminderDelay: number   // days before first reminder
  reminderFrequency: number // days between subsequent reminders
  // Expiration settings
  expireEnabled: boolean
  expireAfter: number     // days until expiration
  expireWarn: number      // days before expiration to warn
  documents: EnvelopeDocument[]
  recipients: Recipient[]
  fields: EnvelopeField[]
  selectedFieldId: string | null
  activeRecipientId: string | null
  activeDocumentId: string | null
  currentStep: number
}

interface EnvelopeActions {
  // Document
  addDocument: (file: File, dataUrl: string, pageCount: number, arrayBuffer: ArrayBuffer) => EnvelopeDocument
  removeDocument: (docId: string) => void
  setActiveDocument: (docId: string) => void
  // Recipient
  addRecipient: () => Recipient
  updateRecipient: (id: string, updates: Partial<Recipient>) => void
  removeRecipient: (id: string) => void
  setActiveRecipient: (id: string) => void
  // Field
  addField: (fieldType: FieldType, documentId: string, pageNumber: number, x: number, y: number) => EnvelopeField | null
  updateField: (id: string, updates: Partial<EnvelopeField>) => void
  removeField: (id: string) => void
  selectField: (id: string) => void
  deselectField: () => void
  duplicateField: (id: string) => EnvelopeField | null
  // Envelope
  setEmailSubject: (s: string) => void
  setEmailBlurb: (s: string) => void
  setEnvelopeStatus: (s: 'created' | 'sent') => void
  setReminderEnabled: (v: boolean) => void
  setReminderDelay: (v: number) => void
  setReminderFrequency: (v: number) => void
  setExpireEnabled: (v: boolean) => void
  setExpireAfter: (v: number) => void
  setExpireWarn: (v: number) => void
  generatePayload: () => EnvelopePayload
  reset: () => void
  // Derived helpers
  getActiveDocument: () => EnvelopeDocument | undefined
  getActiveRecipient: () => Recipient | undefined
  getSelectedField: () => EnvelopeField | undefined
  getFieldsByDocument: (documentId: string) => EnvelopeField[]
  getRecipientColor: (recipientId: string) => string
}

export type EnvelopeStore = EnvelopeState & EnvelopeActions

/**
 * Generate a tab label in the format: fieldType-recipientId-1001
 * The numeric suffix increments per field type across all recipients.
 */
function generateTabLabel(fieldType: FieldType, recipientId: string, existingFields: EnvelopeField[]): string {
  const prefix = `${fieldType}-${recipientId}-`
  let maxNum = 1000
  for (const f of existingFields) {
    if (f.tabLabel.startsWith(prefix)) {
      const num = parseInt(f.tabLabel.slice(prefix.length), 10)
      if (!isNaN(num) && num > maxNum) maxNum = num
    }
  }
  return `${prefix}${maxNum + 1}`
}

export const useEnvelopeStore = create<EnvelopeStore>((set, get) => ({
  // ── State ──
  emailSubject: '',
  emailBlurb: '',
  envelopeStatus: 'sent',
  reminderEnabled: false,
  reminderDelay: 1,
  reminderFrequency: 1,
  expireEnabled: false,
  expireAfter: 120,
  expireWarn: 3,
  documents: [],
  recipients: [],
  fields: [],
  selectedFieldId: null,
  activeRecipientId: null,
  activeDocumentId: null,
  currentStep: 1,

  // ── Document Actions ──
  addDocument(file, dataUrl, pageCount, arrayBuffer) {
    const id = uuidv4()
    storeDocumentBinary(id, { arrayBuffer, file, dataUrl })
    const doc: EnvelopeDocument = {
      id,
      name: file.name,
      pageCount,
      order: get().documents.length + 1,
    }
    set((s) => ({
      documents: [...s.documents, doc],
      activeDocumentId: s.activeDocumentId ?? id,
    }))
    return doc
  },

  removeDocument(docId) {
    removeDocumentBinary(docId)
    set((s) => {
      const documents = s.documents.filter((d) => d.id !== docId)
      const fields = s.fields.filter((f) => f.documentId !== docId)
      return {
        documents,
        fields,
        activeDocumentId: s.activeDocumentId === docId ? (documents[0]?.id ?? null) : s.activeDocumentId,
      }
    })
  },

  setActiveDocument(docId) {
    set({ activeDocumentId: docId })
  },

  // ── Recipient Actions ──
  addRecipient() {
    const recipient: Recipient = {
      id: uuidv4(),
      type: 'signers',
      name: '',
      email: '',
      routingOrder: get().recipients.length + 1,
      recipientId: String(get().recipients.length + 1),
    }
    set((s) => ({
      recipients: [...s.recipients, recipient],
      activeRecipientId: s.activeRecipientId ?? recipient.id,
    }))
    return recipient
  },

  updateRecipient(id, updates) {
    set((s) => ({
      recipients: s.recipients.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    }))
  },

  removeRecipient(id) {
    set((s) => {
      const recipients = s.recipients.filter((r) => r.id !== id)
      const fields = s.fields.filter((f) => f.recipientId !== id)
      return {
        recipients,
        fields,
        activeRecipientId: s.activeRecipientId === id ? (recipients[0]?.id ?? null) : s.activeRecipientId,
      }
    })
  },

  setActiveRecipient(id) {
    set({ activeRecipientId: id })
  },

  // ── Field Actions ──
  addField(fieldType, documentId, pageNumber, x, y) {
    const state = get()
    if (!state.activeRecipientId) return null

    const fieldDef = FIELD_TYPES.find((f) => f.type === fieldType)
    if (!fieldDef) return null

    const recipient = state.recipients.find((r) => r.id === state.activeRecipientId)
    const tabLabel = generateTabLabel(fieldType, recipient?.recipientId ?? '1', state.fields)

    const field: EnvelopeField = {
      id: uuidv4(),
      type: fieldType,
      label: fieldDef.label,
      documentId,
      recipientId: state.activeRecipientId,
      pageNumber,
      x,
      y,
      width: fieldDef.defaultWidth,
      height: fieldDef.defaultHeight,
      required: true,
      readOnly: false,
      locked: false,
      tabLabel,
      tooltip: '',
      font: 'Lucida Console',
      fontSize: 9,
      fontColor: 'Black',
      bold: false,
      italic: false,
      underline: false,
      value: '',
      conditionalParentLabel: '',
      conditionalParentValue: '',
      ...(fieldType === 'list' ? { listItems: [{ text: 'Option 1', value: 'option1' }] } : {}),
      ...(fieldType === 'radioGroup'
        ? {
            groupName: `RadioGroup_${uuidv4().substring(0, 6)}`,
            radios: [
              { x: 0, y: 0, value: 'Radio1', selected: true },
              { x: 0, y: 28, value: 'Radio2', selected: false },
              { x: 0, y: 56, value: 'Radio3', selected: false },
            ],
          }
        : {}),
      ...(fieldType === 'checkboxGroup'
        ? {
            checkboxes: [
              { x: 0, y: 0, value: 'Check1', selected: true },
              { x: 0, y: 28, value: 'Check2', selected: false },
              { x: 0, y: 56, value: 'Check3', selected: false },
            ],
          }
        : {}),
      ...(fieldType === 'formulaTab' ? { formula: '' } : {}),
      ...(fieldType === 'signHere' || fieldType === 'initialHere' || fieldType === 'stampHere'
        ? { scaleValue: 100 }
        : {}),
      ...(fieldType === 'text' || fieldType === 'number'
        ? { maxLength: 4000, validationPattern: '', validationMessage: '' }
        : {}),
    }

    set((s) => ({
      fields: [...s.fields, field],
      selectedFieldId: field.id,
    }))
    return field
  },

  updateField(id, updates) {
    set((s) => ({
      fields: s.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }))
  },

  removeField(id) {
    set((s) => ({
      fields: s.fields.filter((f) => f.id !== id),
      selectedFieldId: s.selectedFieldId === id ? null : s.selectedFieldId,
    }))
  },

  selectField(id) {
    set({ selectedFieldId: id })
  },

  deselectField() {
    set({ selectedFieldId: null })
  },

  duplicateField(id) {
    const state = get()
    const field = state.fields.find((f) => f.id === id)
    if (!field) return null
    const recipient = state.recipients.find((r) => r.id === field.recipientId)
    const newField: EnvelopeField = {
      ...structuredClone(field),
      id: uuidv4(),
      x: field.x + 20,
      y: field.y + 20,
      tabLabel: generateTabLabel(field.type, recipient?.recipientId ?? '1', state.fields),
    }
    set((s) => ({
      fields: [...s.fields, newField],
      selectedFieldId: newField.id,
    }))
    return newField
  },

  // ── Envelope ──
  setEmailSubject(s) {
    set({ emailSubject: s })
  },
  setEmailBlurb(s) {
    set({ emailBlurb: s })
  },
  setEnvelopeStatus(s) {
    set({ envelopeStatus: s })
  },
  setReminderEnabled(v) {
    set({ reminderEnabled: v })
  },
  setReminderDelay(v) {
    set({ reminderDelay: v })
  },
  setReminderFrequency(v) {
    set({ reminderFrequency: v })
  },
  setExpireEnabled(v) {
    set({ expireEnabled: v })
  },
  setExpireAfter(v) {
    set({ expireAfter: v })
  },
  setExpireWarn(v) {
    set({ expireWarn: v })
  },

  reset() {
    clearDocumentBinaries()
    set({
      emailSubject: '',
      emailBlurb: '',
      envelopeStatus: 'sent',
      reminderEnabled: false,
      reminderDelay: 1,
      reminderFrequency: 1,
      expireEnabled: false,
      expireAfter: 120,
      expireWarn: 3,
      documents: [],
      recipients: [],
      fields: [],
      selectedFieldId: null,
      activeRecipientId: null,
      activeDocumentId: null,
      currentStep: 1,
    })
  },

  // ── Derived Helpers ──
  getActiveDocument() {
    const s = get()
    return s.documents.find((d) => d.id === s.activeDocumentId)
  },

  getActiveRecipient() {
    const s = get()
    return s.recipients.find((r) => r.id === s.activeRecipientId)
  },

  getSelectedField() {
    const s = get()
    return s.fields.find((f) => f.id === s.selectedFieldId)
  },

  getFieldsByDocument(documentId) {
    return get().fields.filter((f) => f.documentId === documentId)
  },

  getRecipientColor(recipientId) {
    const idx = get().recipients.findIndex((r) => r.id === recipientId)
    return RECIPIENT_COLORS[idx % RECIPIENT_COLORS.length]
  },

  // ── Export ──
  generatePayload(): EnvelopePayload {
    const state = get()
    const envelope: EnvelopePayload = {
      emailSubject: state.emailSubject || 'Please sign this document',
      emailBlurb: state.emailBlurb || '',
      status: state.envelopeStatus,
      documents: state.documents.map((doc, idx) => ({
        documentId: String(idx + 1),
        name: doc.name,
        fileExtension: doc.name.split('.').pop(),
        documentBase64: '{{BASE64_DOCUMENT_CONTENT}}',
        order: String(doc.order),
      })),
      recipients: {},
    }

    // Build notification object if reminders or expirations are enabled
    if (state.reminderEnabled || state.expireEnabled) {
      const notification: PayloadNotification = {
        useAccountDefaults: 'false',
        reminders: {
          reminderEnabled: String(state.reminderEnabled),
          reminderDelay: String(state.reminderDelay),
          reminderFrequency: String(state.reminderFrequency),
        },
        expirations: {
          expireEnabled: String(state.expireEnabled),
          expireAfter: String(state.expireAfter),
          expireWarn: String(state.expireWarn),
        },
      }
      envelope.notification = notification
    }

    const recipientsByType: Record<string, PayloadRecipient[]> = {}

    for (const r of state.recipients) {
      if (!recipientsByType[r.type]) {
        recipientsByType[r.type] = []
      }

      const recipientObj: PayloadRecipient = {
        recipientId: r.recipientId,
        name: r.name,
        email: r.email,
        routingOrder: String(r.routingOrder),
        tabs: {},
      }

      const recipientFields = state.fields.filter((f) => f.recipientId === r.id)
      let tabOrderCounter = 1
      for (const field of recipientFields) {
        const docIndex = state.documents.findIndex((d) => d.id === field.documentId)
        const tabType = TAB_TYPE_MAP[field.type] ?? `${field.type}Tabs`

        if (!recipientObj.tabs[tabType]) {
          recipientObj.tabs[tabType] = []
        }

        const tab: PayloadTab = {
          documentId: String(docIndex + 1),
          pageNumber: String(field.pageNumber),
          xPosition: String(Math.round(field.x)),
          yPosition: String(Math.round(field.y)),
          tabLabel: field.tabLabel,
          tabOrder: String(tabOrderCounter++),
          required: String(field.required),
        }

        if (field.scaleValue != null && (field.type === 'signHere' || field.type === 'initialHere' || field.type === 'stampHere')) {
          tab.scaleValue = String(field.scaleValue)
        } else {
          if (field.width) tab.width = String(field.width)
          if (field.height) tab.height = String(field.height)
        }
        if (field.tooltip) tab.toolTip = field.tooltip
        if (field.font) tab.font = field.font
        if (field.fontSize) tab.fontSize = `Size${field.fontSize}`
        if (field.fontColor) tab.fontColor = field.fontColor
        if (field.bold) tab.bold = String(field.bold)
        if (field.italic) tab.italic = String(field.italic)
        if (field.underline) tab.underline = String(field.underline)
        if (field.locked) tab.locked = String(field.locked)
        if (field.readOnly) tab.readOnly = String(field.readOnly)
        if (field.type === 'checkbox') {
          tab.selected = String(field.value === 'true' || field.value === 'yes')
        } else if (field.value) {
          tab.value = field.value
        }
        if (field.conditionalParentLabel) tab.conditionalParentLabel = field.conditionalParentLabel
        if (field.conditionalParentValue) tab.conditionalParentValue = field.conditionalParentValue

        if (field.type === 'list' && field.listItems) {
          tab.listItems = field.listItems
        }
        if (field.type === 'radioGroup') {
          tab.groupName = field.groupName
          tab.radios = (field.radios ?? []).map((r) => ({
            pageNumber: String(field.pageNumber),
            xPosition: String(Math.round(r.x)),
            yPosition: String(Math.round(r.y)),
            value: r.value,
            selected: String(r.selected),
          }))
        }
        if (field.type === 'formulaTab' && field.formula) {
          tab.formula = field.formula
        }
        if (field.type === 'text' || field.type === 'number') {
          if (field.maxLength) tab.maxLength = String(field.maxLength)
          if (field.validationPattern) tab.validationPattern = field.validationPattern
          if (field.validationMessage) tab.validationMessage = field.validationMessage
        }

        // Checkbox groups emit individual checkboxTabs instead of a single tab
        if (field.type === 'checkboxGroup') {
          for (const cb of field.checkboxes ?? []) {
            const cbTab: PayloadTab = {
              documentId: String(docIndex + 1),
              pageNumber: String(field.pageNumber),
              xPosition: String(Math.round(field.x + cb.x)),
              yPosition: String(Math.round(field.y + cb.y)),
              tabLabel: cb.value,
              tabOrder: String(tabOrderCounter++),
              required: String(field.required),
              selected: String(cb.selected),
            }
            if (field.tooltip) cbTab.toolTip = field.tooltip
            if (field.locked) cbTab.locked = String(field.locked)
            if (field.readOnly) cbTab.readOnly = String(field.readOnly)
            if (field.conditionalParentLabel) cbTab.conditionalParentLabel = field.conditionalParentLabel
            if (field.conditionalParentValue) cbTab.conditionalParentValue = field.conditionalParentValue
            recipientObj.tabs[tabType].push(cbTab)
          }
        } else {
          recipientObj.tabs[tabType].push(tab)
        }
      }

      recipientsByType[r.type].push(recipientObj)
    }

    envelope.recipients = recipientsByType
    return envelope
  },
}))
