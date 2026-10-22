/**
 * Maps extracted label fields onto `photo_submissions` columns.
 *
 * The prompt asks for fifteen fields; the table stores thirteen. Two
 * identifiers are deliberately not stored on their own:
 *
 * - `gtin` folds into `barcode` as a fallback, matching the behaviour the
 *   application has today. It is still extracted, because giving the model a
 *   separate home for the GTIN is what keeps `barcode` clean.
 * - `udi` is extracted but discarded. It is kept in the prompt so the model is
 *   not tempted to put a UDI value into `barcode` or `gtin`.
 *
 * Adding columns for either one is a schema decision, not an extraction one.
 */

import { OUTPUT_FIELDS } from './prompt.mjs'

/** Extraction field -> database column, for the fields stored directly. */
export const COLUMN_BY_FIELD = Object.freeze({
  name: 'name',
  manufacturer: 'manufacturer',
  barcode: 'barcode',
  size: 'size',
  manufacture_date: 'date_of_manufacture',
  expiration_date: 'expiration',
  lot_number: 'lot',
  reference_number: 'ref',
  quantity: 'quantity',
  manufacture_address: 'manufacture_address',
  manufacture_site: 'manufacture_site',
  sponsor: 'sponsor',
  notes: 'notes'
})

/** Extracted, but not stored in a column of its own. */
export const UNSTORED_FIELDS = Object.freeze(['gtin', 'udi'])

/**
 * Convert a validated extraction into the column update for one submission.
 *
 * @param {Record<string, string|null>} extraction
 * @returns {Record<string, string|null>}
 */
export function toSubmissionColumns(extraction) {
  const columns = {}
  for (const [field, column] of Object.entries(COLUMN_BY_FIELD)) {
    columns[column] = extraction[field] ?? null
  }

  // Preserves the existing precedence: the complete printed barcode wins, and
  // a standalone GTIN is used only when no barcode text was readable.
  columns.barcode = extraction.barcode ?? extraction.gtin ?? null

  return columns
}

/**
 * Every extraction field is either stored or explicitly unstored — no field
 * may be silently dropped by a future prompt change.
 */
export function unmappedFields() {
  return OUTPUT_FIELDS.filter(
    (field) => !(field in COLUMN_BY_FIELD) && !UNSTORED_FIELDS.includes(field)
  )
}
