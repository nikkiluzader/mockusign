/**
 * Non-reactive storage for binary document data (ArrayBuffer, File).
 *
 * ArrayBuffer objects MUST NOT be placed into any state management system
 * because frameworks may wrap them in Proxy or structuredClone them,
 * which detaches the underlying buffer and makes them unusable.
 *
 * This module stores binary data in a plain Map outside all state systems.
 */

interface DocumentBinary {
  arrayBuffer: ArrayBuffer
  file: File
  dataUrl: string
}

const storage = new Map<string, DocumentBinary>()

export function storeDocumentBinary(docId: string, data: DocumentBinary): void {
  storage.set(docId, data)
}

export function getDocumentBinary(docId: string): DocumentBinary | undefined {
  return storage.get(docId)
}

export function getDocumentArrayBuffer(docId: string): ArrayBuffer | undefined {
  return storage.get(docId)?.arrayBuffer
}

export function removeDocumentBinary(docId: string): void {
  storage.delete(docId)
}

export function clearDocumentBinaries(): void {
  storage.clear()
}
