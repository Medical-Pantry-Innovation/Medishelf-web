/**
 * Label extraction rules, configuration, and field mapping.
 *
 * Nothing imports this module yet — the API route is wired to it in the
 * following change.
 */

export {
  PROMPT,
  PROMPT_VERSION,
  PROMPT_SHA256,
  OUTPUT_EXAMPLE,
  OUTPUT_FIELDS,
  BASE_PROMPT_VERSION,
  BASE_PROMPT_SHA256
} from './prompt.mjs'

export {
  SCHEMA_NAME,
  EXTRACTION_SCHEMA,
  RESPONSE_FORMAT,
  validateExtraction,
  ExtractionPayloadError
} from './schema.mjs'

export {
  TEMPERATURE,
  DEFAULT_BASE_URL,
  DEFAULT_TIMEOUT_MS,
  OcrConfigurationError,
  loadOcrConfig,
  validateModelSlug,
  errorCategory
} from './config.mjs'

export { COLUMN_BY_FIELD, UNSTORED_FIELDS, toSubmissionColumns, unmappedFields } from './mapping.mjs'
