// ── Recipient Types ──

export type RecipientType =
  | 'signers'
  | 'carbonCopies'
  | 'certifiedDeliveries'
  | 'inPersonSigners'
  | 'agents'
  | 'intermediaries'

export interface RecipientTypeOption {
  value: RecipientType
  label: string
}

export interface Recipient {
  id: string
  type: RecipientType
  name: string
  email: string
  routingOrder: number
  recipientId: string
}

// ── Field / Tab Types ──

export type FieldCategory = 'signature' | 'standard' | 'input' | 'other'

export type FieldType =
  | 'signHere'
  | 'initialHere'
  | 'dateSignedTabs'
  | 'fullName'
  | 'emailAddress'
  | 'company'
  | 'title'
  | 'text'
  | 'number'
  | 'checkbox'
  | 'checkboxGroup'
  | 'list'
  | 'radioGroup'
  | 'note'
  | 'approve'
  | 'decline'
  | 'formulaTab'
  | 'attachmentTab'
  | 'stampHere'

export interface FieldTypeDefinition {
  type: FieldType
  label: string
  icon: string
  category: FieldCategory
  defaultWidth: number
  defaultHeight: number
}

export interface ListItem {
  text: string
  value: string
}

export interface RadioItem {
  x: number
  y: number
  value: string
  selected: boolean
}

export interface PayloadRadio {
  pageNumber: string
  xPosition: string
  yPosition: string
  value: string
  selected: string
}

export interface EnvelopeField {
  id: string
  type: FieldType
  label: string
  documentId: string
  recipientId: string
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  required: boolean
  readOnly: boolean
  locked: boolean
  tabLabel: string
  tooltip: string
  font: string
  fontSize: number
  fontColor: string
  bold: boolean
  italic: boolean
  underline: boolean
  value: string
  conditionalParentLabel: string
  conditionalParentValue: string
  listItems?: ListItem[]
  groupName?: string
  radios?: RadioItem[]
  checkboxes?: RadioItem[]
  formula?: string
  scaleValue?: number
  maxLength?: number
  validationPattern?: string
  validationMessage?: string
}

export interface EnvelopeDocument {
  id: string
  name: string
  pageCount: number
  order: number
}

export interface FontColorOption {
  value: string
  label: string
}

export interface PayloadTab {
  documentId: string
  pageNumber: string
  xPosition: string
  yPosition: string
  tabLabel: string
  tabOrder?: string
  required: string
  width?: string
  height?: string
  toolTip?: string
  font?: string
  fontSize?: string
  fontColor?: string
  bold?: string
  italic?: string
  underline?: string
  locked?: string
  readOnly?: string
  selected?: string
  value?: string
  conditionalParentLabel?: string
  conditionalParentValue?: string
  listItems?: ListItem[]
  groupName?: string
  radios?: PayloadRadio[]
  formula?: string
  scaleValue?: string
  maxLength?: string
  validationPattern?: string
  validationMessage?: string
}

export interface PayloadRecipient {
  recipientId: string
  name: string
  email: string
  routingOrder: string
  tabs: Record<string, PayloadTab[]>
}

export interface PayloadDocument {
  documentId: string
  name: string
  fileExtension: string | undefined
  documentBase64: string
  order: string
}

export interface PayloadReminders {
  reminderEnabled: string
  reminderDelay: string
  reminderFrequency: string
}

export interface PayloadExpirations {
  expireEnabled: string
  expireAfter: string
  expireWarn: string
}

export interface PayloadNotification {
  useAccountDefaults: string
  reminders: PayloadReminders
  expirations: PayloadExpirations
}

export interface EnvelopePayload {
  emailSubject: string
  emailBlurb: string
  status: string
  notification?: PayloadNotification
  documents: PayloadDocument[]
  recipients: Record<string, PayloadRecipient[]>
}

export type FieldIconMap = Record<FieldType, string>
