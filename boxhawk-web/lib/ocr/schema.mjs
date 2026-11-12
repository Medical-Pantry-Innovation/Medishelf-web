/**
 * Strict JSON Schema sent with the extraction request.
 *
 * The provider enforces this server-side, so the model cannot omit a key, add
 * one, nest the result, or wrap it in Markdown. That removes the need to guess
 * at the shape of the response after it arrives.
 *
 * The field list is derived from the prompt's own output example rather than
 * written out again here, so the two cannot drift apart.
 */

import { OUTPUT_FIELDS } from './prompt.mjs'

export const SCHEMA_NAME = 'medical_label_extraction'

export const EXTRACTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [...OUTPUT_FIELDS],
  properties: Object.fromEntries(
    OUTPUT_FIELDS.map((field) => [field, { type: ['string', 'null'] }])
  )
}

export const RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: SCHEMA_NAME,
    strict: true,
    schema: EXTRACTION_SCHEMA
  }
}

/**
 * Validate a parsed provider payload against the contract above.
 *
 * Returns the payload with blank strings collapsed to null. Throws when the
 * payload cannot be represented, so a malformed response becomes a visible
 * failure instead of a silently empty record.
 *
 * @param {unknown} payload
 * @returns {Record<string, string|null>}
 */
export function validateExtraction(payload) {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ExtractionPayloadError('Structured output must be a JSON object')
  }

  const unknown = Object.keys(payload).filter((key) => !OUTPUT_FIELDS.includes(key))
  if (unknown.length > 0) {
    throw new ExtractionPayloadError(`Structured output has unexpected keys: ${unknown.join(', ')}`)
  }

  const validated = {}
  for (const field of OUTPUT_FIELDS) {
    const value = payload[field]
    if (value === undefined || value === null) {
      validated[field] = null
      continue
    }
    if (typeof value !== 'string') {
      throw new ExtractionPayloadError(`Field "${field}" must be a string or null`)
    }
    validated[field] = value.trim() === '' ? null : value
  }
  return validated
}

export class ExtractionPayloadError extends Error {
  name = 'ExtractionPayloadError'
}
