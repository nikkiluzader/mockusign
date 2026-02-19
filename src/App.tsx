import { Routes, Route } from 'react-router-dom'
import EnvelopeSetup from '@/pages/EnvelopeSetup'
import DocumentEditor from '@/pages/DocumentEditor'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EnvelopeSetup />} />
      <Route path="/editor" element={<DocumentEditor />} />
    </Routes>
  )
}
