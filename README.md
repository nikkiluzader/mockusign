# MockuSign

A DocuSign envelope builder UI that lets you visually construct API payloads for the [DocuSign eSignature REST API](https://developers.docusign.com/docs/esign-rest-api/). Instead of sending envelopes, MockuSign exports the JSON payload so you can inspect, test, or integrate it into your own workflow.

Maintainer contact: nikkiluzader@gmail.com

## What It Does

1. **Upload PDFs** — Drag-and-drop or browse for PDF documents. Multiple documents are supported and appear as tabs in the editor.
2. **Add Recipients** — Define up to 8 color-coded recipients: signers, CC recipients, certified deliveries, in-person signers, agents, and intermediaries, each with name, email, and routing order.
3. **Configure Settings** — Set envelope status (send or draft), reminders (delay & frequency), and expiration (days & warning).
4. **Place Fields** — Drag 18 field types across four categories (Signature, Standard, Input, Other) onto PDF pages. Fields are color-coded to their assigned recipient.
5. **Edit Properties** — Click any placed field to configure flags, position, size or scale, label, tooltip, default value, font, validation, conditional logic, and type-specific settings.
6. **Export JSON** — Generate a complete `POST /v2.1/accounts/{accountId}/envelopes` payload. Copy to clipboard or download as a file.

## Why

- **API Development** — Quickly prototype envelope definitions without writing JSON by hand.
- **Testing** — 10 built-in test cases auto-generate envelopes with various field configurations so you can verify your integration logic.
- **Learning** — See how DocuSign tab types, recipient routing, and envelope structure map to the REST API.

## Field Types (18)

| Category | Fields |
|----------|--------|
| **Signature** | Sign (scalable 50–200%), Initial (scalable), Date Signed, Stamp (scalable) |
| **Standard** | Name, Email, Company, Title |
| **Input** | Text (resizable, validation), Number (resizable, validation), Checkbox (group overlay), Dropdown (list/series editor), Radio (group overlay) |
| **Other** | Note (resizable), Approve, Decline, Formula (expression editor), Attachment (resizable) |

### Field Behaviors

- **Drag to move** — All fields can be repositioned on the page.
- **Corner resize** — Resizable types (text, number, note, list, formula, attachment) have corner handles for adjusting width and height.
- **Scale resize** — Signature, initial, and stamp fields resize via scale percentage (50–200%), maintaining aspect ratio.
- **Group overlays** — Radio and checkbox groups render individual items that can be dragged independently. A dashed bounding box auto-sizes around all items. Use the + button to add new items.
- **Field toolbar** — Selected fields show duplicate and delete buttons above the field.

## Recipient Types (6)

| API Value | Display Label |
|-----------|---------------|
| `signers` | Needs to Sign |
| `carbonCopies` | Receives a Copy |
| `certifiedDeliveries` | Needs to View |
| `inPersonSigners` | In Person Signer |
| `agents` | Manages Envelope |
| `intermediaries` | Allow to Edit |

## Properties Panel

Every field type shows sections in a consistent order:

1. **Flags** — Required, Read Only, Locked
2. **Recipient** — Reassign to any recipient
3. **Position & Size** — X/Y; Width/Height (resizable) or Scale % slider (scalable)
4. **Tab Label / Group Label** — Auto-generated, editable
5. **Default Value** — For applicable types
6. **Tooltip**
7. **Type-specific** — Radio/Checkbox values, Dropdown options (list/series modes), Formula expression
8. **Font** — Family, size, color, bold/italic/underline
9. **Validation** — Max length, regex pattern, validation message (text/number only)
10. **Conditional Logic** — Parent label and parent value

## Envelope Settings

- **Status** — Send immediately or save as draft
- **Reminders** — Toggle on/off; first reminder after N days; repeat every N days
- **Expiration** — Toggle on/off; expire after N days; warn N days before expiry

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 + TypeScript |
| State | Zustand |
| Routing | React Router DOM 7 |
| PDF Rendering | pdfjs-dist 5 |
| Build | Vite 7 |
| IDs | uuid |

## Project Structure

```
src/
├── components/
│   ├── CheckboxGroupOverlay.tsx  # Checkbox group overlay with individual item dragging
│   ├── DraggableField.tsx        # Draggable/resizable/scalable field overlay on PDF pages
│   ├── ExportModal.tsx           # JSON payload viewer with copy/download
│   ├── FieldPalette.tsx          # Left sidebar with draggable field types by category
│   ├── FieldProperties.tsx       # Right sidebar property editor (10 sections)
│   ├── HelpModal.tsx             # App info/help modal
│   ├── PdfViewer.tsx             # PDF canvas rendering + field drop zone + zoom controls
│   ├── RadioGroupOverlay.tsx     # Radio group overlay with individual item dragging
│   ├── RecipientSelector.tsx     # Recipient switcher for field assignment
│   └── TestCaseSidebar.tsx       # 10 pre-built test case loader
├── pages/
│   ├── EnvelopeSetup.tsx         # Step 1: Upload docs, add recipients, settings
│   └── DocumentEditor.tsx        # Step 2: Place & configure fields, export
├── stores/
│   ├── documentBinaryStore.ts    # Non-reactive ArrayBuffer storage
│   └── envelope.ts               # Zustand store: state, actions, payload generation
├── types.ts                      # TypeScript interfaces
├── constants.ts                  # Field icon emoji map
├── App.tsx                       # Router
├── main.tsx                      # Entry point
└── index.css                     # Global styles
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Test Cases (10)

The Setup page includes a sidebar with 10 pre-built test cases that auto-load a PDF, create recipients, place fields, and navigate to the editor:

| # | Name | Description |
|---|------|-------------|
| 1 | Basic Signature | Single signer, single-page PDF, sent immediately |
| 2 | Two Signers (Multi-Page) | 10-page PDF, two signers on different pages, daily reminders |
| 3 | Form with Inputs | Number, checkboxes, dropdown, radio — expires in 30 days |
| 4 | Approval Workflow | Signer + approver (approve/decline) + certified delivery viewer |
| 5 | Kitchen Sink (10 pages) | Every field type across two recipients, reminders + expiration |
| 6 | Draft Envelope | Saved as draft, single-page, no reminders |
| 7 | CC + Aggressive Reminders | Signer + 2 CC, daily reminders, expires in 14 days |
| 8 | Multi-Role Routing | 4 recipients: signer, in-person, agent, CC — ordered routing |
| 9 | Draft with Expiration | Draft, 10-page, number fields, 180-day expiration |
| 10 | Minimal — Signature Only | Just a signature and date, single-page |

## Tab Label Format

Fields are assigned tab labels in the format: `{fieldType}-{recipientId}-{incrementalNumber}`

Example: `signHere-1-1001`, `text-2-1001`, `checkbox-1-1002`

## SEO

MockuSign includes baseline SEO metadata in `index.html`:

- Optimized page title and meta description
- Search keywords and robots directives
- Canonical URL pointing to the GitHub project
- Open Graph tags for richer link previews
- Twitter card tags
- JSON-LD `SoftwareApplication` schema with author/contact details

For production deployment, update canonical and social URLs to your live domain.

## License

GNU GPLv3 (`GPL-3.0-only`). See the `LICENSE` file.
