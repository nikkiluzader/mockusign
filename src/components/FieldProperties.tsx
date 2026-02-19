import { useState } from 'react'
import { useEnvelopeStore, FONT_OPTIONS, FONT_SIZE_OPTIONS, FONT_COLOR_OPTIONS } from '@/stores/envelope'
import { FIELD_ICONS } from '@/constants'
import type { ListItem, RadioItem, EnvelopeField } from '@/types'
import styles from './FieldProperties.module.css'

export default function FieldProperties() {
  const selectedFieldId = useEnvelopeStore((s) => s.selectedFieldId)
  const fields = useEnvelopeStore((s) => s.fields)
  const updateField = useEnvelopeStore((s) => s.updateField)
  const recipients = useEnvelopeStore((s) => s.recipients)
  const [listMode, setListMode] = useState<'list' | 'series'>('list')

  const field = fields.find((f) => f.id === selectedFieldId)

  if (!field) {
    return (
      <div className={styles.panel}>
        <div className={styles.emptyState}>
          <p>Select a field to edit its properties</p>
        </div>
      </div>
    )
  }

  function update(updates: Partial<EnvelopeField>) {
    updateField(field!.id, updates)
  }

  function addListItem() {
    const items = [...(field!.listItems ?? [])]
    items.push({ text: `Option ${items.length + 1}`, value: `option${items.length + 1}` })
    update({ listItems: items })
  }

  function removeListItem(idx: number) {
    const items = [...(field!.listItems ?? [])]
    items.splice(idx, 1)
    update({ listItems: items })
  }

  function updateListItem(idx: number, changes: Partial<ListItem>) {
    const items = [...(field!.listItems ?? [])]
    items[idx] = { ...items[idx], ...changes }
    update({ listItems: items })
  }

  function addRadio() {
    const radios = [...(field!.radios ?? [])]
    radios.push({ x: 0, y: radios.length * 25, value: `option${radios.length + 1}`, selected: false })
    update({ radios })
  }

  function removeRadio(idx: number) {
    const radios = [...(field!.radios ?? [])]
    radios.splice(idx, 1)
    update({ radios })
  }

  function updateRadio(idx: number, changes: Partial<RadioItem>) {
    const radios = [...(field!.radios ?? [])]
    radios[idx] = { ...radios[idx], ...changes }
    update({ radios })
  }

  function addCheckbox() {
    const cbs = [...(field!.checkboxes ?? [])]
    cbs.push({ x: 0, y: cbs.length * 25, value: `Check${cbs.length + 1}`, selected: false })
    update({ checkboxes: cbs })
  }

  function removeCheckbox(idx: number) {
    const cbs = [...(field!.checkboxes ?? [])]
    cbs.splice(idx, 1)
    update({ checkboxes: cbs })
  }

  function updateCheckbox(idx: number, changes: Partial<RadioItem>) {
    const cbs = [...(field!.checkboxes ?? [])]
    cbs[idx] = { ...cbs[idx], ...changes }
    update({ checkboxes: cbs })
  }

  const isGroupType = field.type === 'radioGroup' || field.type === 'checkboxGroup'
  const isScalable = field.type === 'signHere' || field.type === 'initialHere' || field.type === 'stampHere'
  const isResizable = ['text', 'number', 'note', 'list', 'formulaTab', 'attachmentTab'].includes(field.type)

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.fieldHeader}>
        <span className={styles.fieldIcon}>{FIELD_ICONS[field.type]}</span>
        <div>
          <div className={styles.fieldType}>{field.label}</div>
          <div className={styles.fieldId}>ID: {field.id.substring(0, 8)}</div>
        </div>
      </div>

      {/* Sections — consistent order for all field types */}
      <div className={styles.sections}>

        {/* 1. Flags — always first */}
        <Section title="Flags">
          <div className={styles.checkboxCol}>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={field.required}
                onChange={(e) => update({ required: e.target.checked })}
              />
              Required
            </label>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={field.readOnly}
                onChange={(e) => update({ readOnly: e.target.checked })}
              />
              Read Only
            </label>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                checked={field.locked}
                onChange={(e) => update({ locked: e.target.checked })}
              />
              Locked
            </label>
          </div>
        </Section>

        {/* 2. Recipient */}
        <Section title="Recipient">
          <select
            className="ds-select"
            value={field.recipientId}
            onChange={(e) => update({ recipientId: e.target.value })}
          >
            {recipients.map((r, i) => (
              <option key={r.id} value={r.id}>
                {r.name || `Recipient ${i + 1}`}
              </option>
            ))}
          </select>
        </Section>

        {/* 3. Position & Size (non-group only) */}
        {!isGroupType && (
        <Section title="Position & Size">
          <div className={styles.grid2}>
            <FormItem label="X">
              <input
                className="ds-input"
                type="number"
                value={Math.round(field.x)}
                onChange={(e) => update({ x: parseInt(e.target.value) || 0 })}
              />
            </FormItem>
            <FormItem label="Y">
              <input
                className="ds-input"
                type="number"
                value={Math.round(field.y)}
                onChange={(e) => update({ y: parseInt(e.target.value) || 0 })}
              />
            </FormItem>
            {isScalable ? (
              <FormItem label="Scale %">
                <div className={styles.scaleControl}>
                  <input
                    className="ds-input"
                    type="range"
                    min={50}
                    max={200}
                    value={field.scaleValue ?? 100}
                    onChange={(e) => update({ scaleValue: parseInt(e.target.value) })}
                  />
                  <span className={styles.scaleValue}>{field.scaleValue ?? 100}%</span>
                </div>
              </FormItem>
            ) : isResizable ? (
              <>
                <FormItem label="Width">
                  <input
                    className="ds-input"
                    type="number"
                    value={field.width}
                    onChange={(e) => update({ width: parseInt(e.target.value) || 0 })}
                  />
                </FormItem>
                <FormItem label="Height">
                  <input
                    className="ds-input"
                    type="number"
                    value={field.height}
                    onChange={(e) => update({ height: parseInt(e.target.value) || 0 })}
                  />
                </FormItem>
              </>
            ) : null}
          </div>
        </Section>
        )}

        {/* 4. Tab Label / Group Label */}
        {isGroupType ? (
          <Section title="Group Label">
            <input
              className="ds-input"
              value={field.groupName ?? ''}
              onChange={(e) => update({ groupName: e.target.value })}
            />
          </Section>
        ) : (
          <Section title="Tab Label">
            <input
              className="ds-input"
              value={field.tabLabel}
              onChange={(e) => update({ tabLabel: e.target.value })}
            />
          </Section>
        )}

        {/* 5. Default Value (applicable types) */}
        {!['signHere', 'initialHere', 'radioGroup', 'checkboxGroup'].includes(field.type) && (
          <Section title="Default Value">
            <input
              className="ds-input"
              value={field.value}
              onChange={(e) => update({ value: e.target.value })}
            />
          </Section>
        )}

        {/* 6. Tooltip */}
        <Section title="Tooltip">
          <input
            className="ds-input"
            value={field.tooltip}
            onChange={(e) => update({ tooltip: e.target.value })}
          />
        </Section>

        {/* 7. Type-specific content */}

        {/* Radio Button Values */}
        {field.type === 'radioGroup' && (
          <Section title="Radio Button Values">
            {(field.radios ?? []).map((radio, idx) => (
              <div key={idx} className={styles.radioValueRow}>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={radio.selected}
                    onChange={(e) => {
                      const radios = (field!.radios ?? []).map((r, i) => ({
                        ...r,
                        selected: i === idx ? e.target.checked : false,
                      }))
                      update({ radios })
                    }}
                  />
                </label>
                <input
                  className="ds-input"
                  value={radio.value}
                  onChange={(e) => updateRadio(idx, { value: e.target.value })}
                />
                <button
                  className={styles.removeItemBtn}
                  onClick={() => removeRadio(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
          </Section>
        )}

        {/* Checkbox Values */}
        {field.type === 'checkboxGroup' && (
          <Section title="Checkbox Values">
            {(field.checkboxes ?? []).map((cb, idx) => (
              <div key={idx} className={styles.radioValueRow}>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={cb.selected}
                    onChange={(e) => {
                      updateCheckbox(idx, { selected: e.target.checked })
                    }}
                  />
                </label>
                <input
                  className="ds-input"
                  value={cb.value}
                  onChange={(e) => updateCheckbox(idx, { value: e.target.value })}
                />
                <button
                  className={styles.removeItemBtn}
                  onClick={() => removeCheckbox(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
          </Section>
        )}

        {/* List Options */}
        {field.type === 'list' && (
          <Section title="Options">
            <div className={styles.listTabs}>
              <button
                className={`${styles.listTab} ${listMode === 'list' ? styles.listTabActive : ''}`}
                onClick={() => setListMode('list')}
              >
                LIST
              </button>
              <button
                className={`${styles.listTab} ${listMode === 'series' ? styles.listTabActive : ''}`}
                onClick={() => setListMode('series')}
              >
                SERIES
              </button>
            </div>
            <p className={styles.listHint}>Fill in the list of options.</p>

            {listMode === 'list' ? (
              <>
                {(field.listItems ?? []).map((item, idx) => (
                  <div key={idx} className={styles.listItemRow}>
                    <input
                      className="ds-input"
                      placeholder={`Option ${idx + 1}`}
                      value={item.text}
                      onChange={(e) => {
                        const val = e.target.value
                        updateListItem(idx, { text: val, value: val.toLowerCase().replace(/\s+/g, '_') })
                      }}
                    />
                    <button
                      className={styles.removeItemBtn}
                      onClick={() => removeListItem(idx)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button className={styles.addOptionBtn} onClick={addListItem}>
                  + ADD OPTION
                </button>
              </>
            ) : (
              <textarea
                className="ds-input"
                rows={3}
                style={{ resize: 'vertical' }}
                placeholder="option1; option2; option3"
                value={(field.listItems ?? []).map((i) => i.text).join('; ')}
                onChange={(e) => {
                  const raw = e.target.value
                  const items: ListItem[] = raw
                    .split(';')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((text) => ({ text, value: text.toLowerCase().replace(/\s+/g, '_') }))
                  update({ listItems: items })
                }}
              />
            )}

            <div className={styles.defaultOption}>
              <label className={styles.formLabel}>Default Option</label>
              <select
                className="ds-select"
                value={field.value}
                onChange={(e) => update({ value: e.target.value })}
              >
                <option value="">-- Select --</option>
                {(field.listItems ?? []).map((item, idx) => (
                  <option key={idx} value={item.value}>
                    {item.text}
                  </option>
                ))}
              </select>
            </div>
          </Section>
        )}

        {/* Formula */}
        {field.type === 'formulaTab' && (
          <Section title="Formula">
            <textarea
              className="ds-input"
              value={field.formula ?? ''}
              onChange={(e) => update({ formula: e.target.value })}
              rows={3}
              style={{ resize: 'vertical' }}
              placeholder='e.g. [field1] + [field2]'
            />
          </Section>
        )}

        {/* 8. Font (applicable types) */}
        {!['checkbox', 'checkboxGroup', 'radioGroup', 'signHere', 'initialHere'].includes(field.type) && (
          <Section title="Font">
            <FormItem label="Font Family">
              <select
                className="ds-select"
                value={field.font}
                onChange={(e) => update({ font: e.target.value })}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </FormItem>

            <div className={styles.grid2}>
              <FormItem label="Size">
                <select
                  className="ds-select"
                  value={field.fontSize}
                  onChange={(e) => update({ fontSize: parseInt(e.target.value) })}
                >
                  {FONT_SIZE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </FormItem>
              <FormItem label="Color">
                <select
                  className="ds-select"
                  value={field.fontColor}
                  onChange={(e) => update({ fontColor: e.target.value })}
                >
                  {FONT_COLOR_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </FormItem>
            </div>

            <div className={styles.checkboxRow}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={field.bold}
                  onChange={(e) => update({ bold: e.target.checked })}
                />
                <strong>B</strong>
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={field.italic}
                  onChange={(e) => update({ italic: e.target.checked })}
                />
                <em>I</em>
              </label>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={field.underline}
                  onChange={(e) => update({ underline: e.target.checked })}
                />
                <u>U</u>
              </label>
            </div>
          </Section>
        )}

        {/* 9. Validation (text/number only) */}
        {(field.type === 'text' || field.type === 'number') && (
          <Section title="Validation">
            <FormItem label="Max Length">
              <input
                className="ds-input"
                type="number"
                value={field.maxLength ?? ''}
                onChange={(e) => update({ maxLength: parseInt(e.target.value) || undefined })}
              />
            </FormItem>
            <FormItem label="Validation Pattern">
              <input
                className="ds-input"
                value={field.validationPattern ?? ''}
                onChange={(e) => update({ validationPattern: e.target.value })}
              />
            </FormItem>
            <FormItem label="Validation Message">
              <input
                className="ds-input"
                value={field.validationMessage ?? ''}
                onChange={(e) => update({ validationMessage: e.target.value })}
              />
            </FormItem>
          </Section>
        )}

        {/* 10. Conditional Logic — always last */}
        <Section title="Conditional Logic">
          <FormItem label="Parent Label">
            <input
              className="ds-input"
              value={field.conditionalParentLabel}
              onChange={(e) => update({ conditionalParentLabel: e.target.value })}
            />
          </FormItem>
          <FormItem label="Parent Value">
            <input
              className="ds-input"
              value={field.conditionalParentValue}
              onChange={(e) => update({ conditionalParentValue: e.target.value })}
            />
          </FormItem>
        </Section>
      </div>
    </div>
  )
}

/* ── Helpers ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.section}>
      <h4 className={styles.sectionTitle}>{title}</h4>
      <div className={styles.sectionBody}>{children}</div>
    </div>
  )
}

function FormItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className={styles.formItem}>
      <label className={styles.formLabel}>{label}</label>
      {children}
    </div>
  )
}
