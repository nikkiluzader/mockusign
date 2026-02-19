import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { useEnvelopeStore } from '@/stores/envelope'
import { getDocumentArrayBuffer } from '@/stores/documentBinaryStore'
import DraggableField from './DraggableField'
import RadioGroupOverlay from './RadioGroupOverlay'
import CheckboxGroupOverlay from './CheckboxGroupOverlay'
import type { FieldType } from '@/types'
import styles from './PdfViewer.module.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).href

export default function PdfViewer() {
  const activeDocumentId = useEnvelopeStore((s) => s.activeDocumentId)
  const fields = useEnvelopeStore((s) => s.fields)
  const addField = useEnvelopeStore((s) => s.addField)
  const deselectField = useEnvelopeStore((s) => s.deselectField)

  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [scale, setScale] = useState(1.0)
  const [numPages, setNumPages] = useState(0)
  const pageCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const pageContainerRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // Load PDF when activeDocumentId changes
  useEffect(() => {
    if (!activeDocumentId) {
      setPdfDoc(null)
      setNumPages(0)
      return
    }

    const buf = getDocumentArrayBuffer(activeDocumentId)
    if (!buf) return

    // Always pass a COPY of the buffer – pdfjs-dist transfers ownership
    // of the underlying ArrayBuffer, which would detach the original.
    const bufCopy = buf.slice(0)

    let cancelled = false
    const loadTask = pdfjsLib.getDocument({ data: new Uint8Array(bufCopy) })

    loadTask.promise
      .then((doc) => {
        if (!cancelled) {
          setPdfDoc(doc)
          setNumPages(doc.numPages)
        }
      })
      .catch((err) => {
        if (!cancelled) console.error('Failed to load PDF:', err)
      })

    return () => {
      cancelled = true
      loadTask.destroy()
    }
  }, [activeDocumentId])

  // Render pages whenever pdfDoc or scale changes
  useEffect(() => {
    if (!pdfDoc) return

    let cancelled = false

    async function renderAll() {
      for (let i = 1; i <= pdfDoc!.numPages; i++) {
        if (cancelled) return
        try {
          const page = await pdfDoc!.getPage(i)
          const viewport = page.getViewport({ scale })
          const canvas = pageCanvasRefs.current.get(i)
          const container = pageContainerRefs.current.get(i)
          if (!canvas || !container) continue

          canvas.width = viewport.width
          canvas.height = viewport.height
          container.style.width = `${viewport.width}px`
          container.style.height = `${viewport.height}px`

          const ctx = canvas.getContext('2d')!
          await page.render({ canvasContext: ctx, viewport, canvas }).promise
        } catch (err) {
          if (!cancelled) console.error(`Failed to render page ${i}:`, err)
        }
      }
    }

    renderAll()
    return () => {
      cancelled = true
    }
  }, [pdfDoc, scale])

  const onDrop = useCallback(
    (e: React.DragEvent, pageNumber: number) => {
      e.preventDefault()
      const fieldType = e.dataTransfer.getData('fieldType') as FieldType
      if (!fieldType || !activeDocumentId) return

      const container = pageContainerRefs.current.get(pageNumber)
      if (!container) return

      const rect = container.getBoundingClientRect()
      const x = (e.clientX - rect.left) / scale
      const y = (e.clientY - rect.top) / scale

      addField(fieldType, activeDocumentId, pageNumber, x, y)
    },
    [activeDocumentId, scale, addField],
  )

  const docFields = activeDocumentId
    ? fields.filter((f) => f.documentId === activeDocumentId)
    : []

  if (!activeDocumentId) {
    return (
      <div className={styles.emptyState}>
        <p>No document selected.</p>
      </div>
    )
  }

  return (
    <div className={styles.viewer}>
      {/* Zoom bar */}
      <div className={styles.zoomBar}>
        <button
          className={styles.zoomBtn}
          onClick={() => setScale((s) => Math.max(0.25, s - 0.15))}
        >
          −
        </button>
        <span className={styles.zoomLabel}>{Math.round(scale * 100)}%</span>
        <button
          className={styles.zoomBtn}
          onClick={() => setScale((s) => Math.min(3, s + 0.15))}
        >
          +
        </button>
        <button className={styles.zoomBtn} onClick={() => setScale(1)}>
          Fit
        </button>
      </div>

      {/* Pages */}
      <div className={styles.pages} onClick={() => deselectField()}>
        {Array.from({ length: numPages }, (_, idx) => {
          const pageNum = idx + 1
          const pageFields = docFields.filter((f) => f.pageNumber === pageNum)

          return (
            <div
              key={pageNum}
              className={styles.pageContainer}
              ref={(el) => {
                if (el) pageContainerRefs.current.set(pageNum, el)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'copy'
              }}
              onDrop={(e) => onDrop(e, pageNum)}
              onClick={(e) => e.stopPropagation()}
            >
              <canvas
                ref={(el) => {
                  if (el) pageCanvasRefs.current.set(pageNum, el)
                }}
                onClick={() => deselectField()}
              />
              {pageFields.filter(f => f.type !== 'radioGroup' && f.type !== 'checkboxGroup').map((field) => (
                <DraggableField key={field.id} field={field} scale={scale} />
              ))}
              {pageFields.filter(f => f.type === 'radioGroup').map((field) => (
                <RadioGroupOverlay key={field.id} field={field} scale={scale} />
              ))}
              {pageFields.filter(f => f.type === 'checkboxGroup').map((field) => (
                <CheckboxGroupOverlay key={field.id} field={field} scale={scale} />
              ))}
              <div className={styles.pageLabel}>Page {pageNum}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
