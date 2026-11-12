/**
 * Walkthrough of the review screen for one sample submission.
 *
 * This is a server component on purpose: it runs the real lib/ocr functions
 * (which reach for node:crypto and so cannot be bundled for the browser) over
 * a fixed payload, then hands the results to the client form. Nothing here
 * calls a model or Supabase, so the page works with no API key and no project
 * configured — which is what makes it usable for a walkthrough.
 */

import {
  PROMPT_VERSION,
  validateExtraction,
  toSubmissionColumns
} from '@/lib/ocr/index.mjs'

import DemoReview from '@/components/DemoReview'

export const metadata = {
  title: 'Extraction walkthrough — Boxhawk'
}

/**
 * A fixed, hand-written stand-in for one model response.
 *
 * It is written out in full, with explicit nulls, because that is the shape
 * the response schema guarantees: fifteen keys, each a string or null.
 */
const SAMPLE_PAYLOAD = {
  gtin: '09327911001522',
  udi: null,
  barcode: '(01)09327911001522(10)215476KS(17)281031',
  manufacture_date: null,
  expiration_date: '2028-10-31',
  lot_number: '215476KS',
  manufacturer: 'Vantyn Medical Pty Ltd',
  name: 'Hypodermic Needle 21G x 38 mm',
  reference_number: 'VN-2138',
  size: '21G x 38 mm',
  quantity: 'Box of 100',
  manufacture_address: '14 Kerrin Way, Dandenong South VIC 3175, Australia',
  manufacture_site: 'Made in Australia',
  sponsor: null,
  notes: 'Single use only; sterilised by ethylene oxide'
}

const SAMPLE_IMAGES = ['/demo/sample-label.svg']

export default function ExtractionDemoPage() {
  // The same two calls the API route makes after a real response arrives.
  const extraction = validateExtraction(SAMPLE_PAYLOAD)
  const columns = toSubmissionColumns(extraction)

  const meta = {
    model: 'google/gemini-2.5-flash',
    prompt_version: PROMPT_VERSION,
    extracted_at: '2026-11-12T09:24:00+11:00'
  }

  return (
    <DemoReview
      images={SAMPLE_IMAGES}
      extraction={extraction}
      columns={columns}
      meta={meta}
      rawPayload={JSON.stringify(SAMPLE_PAYLOAD, null, 2)}
    />
  )
}
