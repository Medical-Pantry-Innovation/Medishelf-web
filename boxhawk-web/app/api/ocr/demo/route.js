/**
 * Data source for the walkthrough at /items/demo.
 *
 * The review screen is the real one — it only swaps where its data comes from.
 * This route stands in for the Supabase read, running the actual extraction
 * rules over a fixed payload so the screen shows what lib/ocr genuinely
 * produces. It calls no model and reads no database, so it works with no API
 * key and no project configured.
 */

import { NextResponse } from 'next/server'

import {
  PROMPT_VERSION,
  validateExtraction,
  toSubmissionColumns
} from '@/lib/ocr/index.mjs'

/**
 * One item from the MediScan evaluation set: case galemed-nasal-cannula-01,
 * MediShelf item #850, photographed as a volunteer would photograph it.
 *
 * The values are that case's hand-reviewed entry, extended with the fields its
 * evaluation did not score (barcode, quantity, addresses, notes) read from the
 * same photograph. Written out in full, with explicit nulls, because that is
 * the shape the response schema guarantees: fifteen keys, string or null.
 *
 * `size` is null on purpose: the reviewer recorded "no size marking on
 * physical label" for this item.
 */
const PAYLOAD = {
  gtin: '06923980110764',
  udi: null,
  barcode: '(01)06923980110764(17)280831(10)250901',
  manufacture_date: '2025-09-01',
  expiration_date: '2028-08-31',
  lot_number: '250901',
  manufacturer: 'GaleMed (Xiamen) Co., Ltd.',
  name: 'Disposable Oxygen Therapy ADULT NASAL CANNULA WITH TUBING',
  reference_number: 'XTA0059',
  size: null,
  quantity: '1',
  manufacture_address:
    'Xiamen Area of China (Fujian) Pilot Free Trade Zone, 39, Section 3, Haijing East Road 361026 Fujian Province, China',
  manufacture_site: 'Made in China',
  sponsor: 'Distributed in Australia by: Medline International Two Australia Pty. Ltd. Sydney',
  notes: 'Do not reuse; not made with natural rubber latex; PHT/DINP free; consult instructions for use'
}

/** As submitted: the item itself, then the panel carrying the label. */
const IMAGES = [
  '/demo/galemed-nasal-cannula-01-01.jpg',
  '/demo/galemed-nasal-cannula-01-02.jpg'
]

/**
 * What a reader that fills every field would have put in the blank.
 * Lives here rather than in the review screen, so the production path carries
 * no demo data.
 */
const GUESSES = {
  size: { value: 'Adult, 2 m tubing', why: 'taken from the product name, not the label' }
}

const EXTRACTED_AT = '2026-11-12T09:24:00+11:00'

export async function GET() {
  // The same two calls the analysis route makes after a real response arrives.
  const extraction = validateExtraction(PAYLOAD)
  const columns = toSubmissionColumns(extraction)

  return NextResponse.json({
    // Shaped like a photo_submissions row, because that is what the review
    // screen expects to be handed.
    submission: {
      id: 'demo',
      status: 'in_review',
      reviewed: false,
      ...columns,
      extraction_model: 'google/gemini-2.5-flash',
      extraction_prompt_version: PROMPT_VERSION,
      extracted_at: EXTRACTED_AT
    },
    images: IMAGES.map((url, index) => ({ id: `demo-${index + 1}`, path: url, url })),
    guesses: GUESSES
  })
}
