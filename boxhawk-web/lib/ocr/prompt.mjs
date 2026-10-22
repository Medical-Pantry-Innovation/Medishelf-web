/**
 * Versioned extraction prompt for medical item labels.
 *
 * Derived from the MediScan evaluation prompt `medical-label-v5`, which was
 * benchmarked across eight vision models on 30 hand-reviewed products. The ten
 * base fields keep their original wording and order so behaviour stays
 * comparable with that benchmark; the five fields this application already
 * stores are appended after them.
 *
 * The version is suffixed rather than numbered on purpose. Plain numbers
 * (`v1`, `v2`, `v5`, ...) belong to prompts that have been through the
 * evaluation harness. This one has not, so it must not claim one.
 */

import { createHash } from 'crypto'

/** Lineage, recorded so any stored result can be traced back to its baseline. */
export const BASE_PROMPT_VERSION = 'medical-label-v5'
export const BASE_PROMPT_SHA256 =
  'a4c29569484929ff525383e8ed283e2d22e23d71677bda52e3ff4db9abd34e21'

export const PROMPT_VERSION = 'medical-label-v5-boxhawk'

/**
 * The exact keys, and their order, that the model must return.
 * The first ten are the `medical-label-v5` contract, unchanged.
 */
export const OUTPUT_EXAMPLE = {
  gtin: null,
  udi: null,
  barcode: null,
  manufacture_date: null,
  expiration_date: null,
  lot_number: null,
  manufacturer: null,
  name: null,
  reference_number: null,
  size: null,
  quantity: null,
  manufacture_address: null,
  manufacture_site: null,
  sponsor: null,
  notes: null
}

export const OUTPUT_FIELDS = Object.freeze(Object.keys(OUTPUT_EXAMPLE))

const OUTPUT_EXAMPLE_JSON = JSON.stringify(OUTPUT_EXAMPLE, null, 2)

export const PROMPT = `You are extracting structured data from photographs of one medical item.

Use every supplied image as another view of the same medical item. Combine information only when
it is clearly visible on those images. Ignore other products that appear in the background or on
unrelated packaging.

Extraction rules:
1. Extract only text and identifiers that are clearly visible in the supplied images.
2. Do not use outside knowledge. Do not infer, guess, complete, translate, expand, or correct text.
3. Preserve the visible wording, capitalization, punctuation, spacing, symbols, codes, and date
   format. Do not normalize values.
4. If a value is absent, unreadable, partially obscured, ambiguous, or cannot be assigned reliably
   to one field, return null for that field.
5. Return exactly one JSON object with the keys shown below, in the same order. Each value must be
   either a JSON string or null. Do not add keys, nesting, arrays, Markdown, comments, or explanatory
   text.

Field definitions:
- gtin: Copy only a value explicitly labelled GTIN, the value identified by GS1 application
  identifier (01), or — when the complete visible barcode is a single plain number with no GS1
  application identifiers at all (a standard EAN/UPC-style barcode, not a GS1-128 string) — that
  whole number, since a bare EAN/UPC number is itself a GTIN. The (01) prefix itself counts as an
  explicit label, even when the word "GTIN" is not printed nearby, but the characters "01" and the
  surrounding parentheses are a structural marker, not digits of the value — never include them in
  the copied value. Preserve leading zeros only when they are part of the number itself (e.g. a
  14-digit zero-padded GTIN). Do not pick one of several different codes on the label when it is
  ambiguous which one is the product identifier. gtin and barcode are not alternatives to each
  other: if you also copy a full barcode string into barcode below, you must still separately copy
  the qualifying value here. Examples: "(01)09327911001522(10)215476KS(17)281031" → gtin =
  "09327911001522" (NOT "0109327911001522" — the "01" is the AI marker, not part of the value). A
  plain barcode "9346438001228" with no application identifiers → gtin = "9346438001228".
- udi: Copy only the complete value explicitly labelled UDI or UDI-DI. Do not construct a UDI by
  joining separate identifiers and do not treat every barcode as a UDI.
- barcode: Copy the complete visible barcode or GS1 identifier text exactly as printed, including
  visible application identifiers and leading zeros. Do not put a standalone GTIN or UDI label value
  here unless the complete barcode text itself is visible. Populating barcode does not replace
  populating gtin, manufacture_date, expiration_date, or lot_number from the same application
  identifiers — fill every field whose application identifier is present in the string.
- manufacture_date: The date explicitly marked as manufacture/manufacturing/MFG/DOM, or the value
  identified by GS1 application identifier (11). Do not use an expiry date here.
- expiration_date: The date explicitly marked as expiry/expiration/EXP/use-by, or the value
  identified by GS1 application identifier (17). Do not use a manufacture date here.
- lot_number: The value explicitly marked LOT or BATCH, or identified by GS1 application identifier
  (10). Do not use a reference or catalogue number. If distinct lot and batch values are both shown
  and the images do not make the intended value unambiguous, return null.
- manufacturer: Copy the manufacturer name exactly as printed. Do not expand a brand, replace it
  with a legal company name, shorten it, or substitute a sponsor or distributor.
- name: Copy the main product name or product designation for the medical item. Do not include a
  company name, identifier, date, generic instructions, or text belonging to a background product.
- reference_number: Use only a value explicitly identified as REF, reference, catalogue, or catalog
  number. Do not use a lot, batch, barcode, GTIN, UDI, or unlabelled regulatory number.
- size: Copy the visible size, gauge, dimensions, volume/capacity, or length of the item itself,
  exactly as printed. Do not normalize symbols, decimal separators, spacing, or units. Do not use
  this field for package quantity or count — that belongs in quantity below. Do not use it for
  performance ratings, test results, or any other printed number that does not describe the physical
  size of the item itself. If no such value applies, return null rather than filling size with an
  unrelated number.
- quantity: Copy the printed statement of how many units the package contains, exactly as printed
  (for example "50 pcs", "Box of 10", or the value identified by GS1 application identifier (30)).
  Use this field only for a count of items. Do not use the item's own size, dimensions, volume, or
  length — those belong in size above.
- manufacture_address: Copy the manufacturer's postal address exactly as printed, and only when the
  address is clearly attributed to the manufacturer. Do not copy a sponsor, distributor, importer, or
  regulatory representative address here — that belongs in sponsor below.
- manufacture_site: Copy a manufacturing site, plant, or country-of-manufacture statement only when
  the label identifies it separately from the manufacturer name and address (for example "Made in
  Germany" or a named facility). Do not repeat the manufacturer name or the full address here.
- sponsor: Copy the sponsor, distributor, importer, or regulatory representative exactly as printed,
  including the printed word identifying that role when one is shown. Do not copy the manufacturer
  here.
- notes: Record only label observations that cannot be assigned to any other field and that matter
  for identifying or handling the item — for example a sterilization marking, a single-use symbol,
  or a storage instruction. Do not restate a value already captured in another field, do not record
  your own uncertainty or reasoning, and do not add advice or interpretation. Return null when there
  is no such observation.

Required JSON structure:
${OUTPUT_EXAMPLE_JSON}

Replace null only when the corresponding value can be read reliably from the supplied images.
Return the JSON object only.
`

export const PROMPT_SHA256 = createHash('sha256').update(PROMPT, 'utf8').digest('hex')
