/**
 * Offline tests for the extraction rules.
 *
 * These run on Node alone: no dependencies, no network, no API key, no
 * database. `npm test` (or `node --test lib/ocr/`) is enough.
 */

import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  PROMPT,
  PROMPT_SHA256,
  PROMPT_VERSION,
  OUTPUT_FIELDS,
  EXTRACTION_SCHEMA,
  RESPONSE_FORMAT,
  validateExtraction,
  ExtractionPayloadError,
  loadOcrConfig,
  validateModelSlug,
  OcrConfigurationError,
  errorCategory,
  toSubmissionColumns,
  unmappedFields,
  TEMPERATURE
} from './index.mjs'

const validEnv = {
  OPENROUTER_API_KEY: 'test-key',
  OPENROUTER_MODEL: 'google/gemini-2.5-flash'
}

// ---------------------------------------------------------------------------
// Model pinning: a stored result must stay traceable to one model version.
// ---------------------------------------------------------------------------

test('a pinned provider/model slug is accepted', () => {
  assert.equal(validateModelSlug('google/gemini-2.5-flash'), 'google/gemini-2.5-flash')
  assert.equal(validateModelSlug('  anthropic/claude-opus-5  '), 'anthropic/claude-opus-5')
})

test('floating model aliases are rejected', () => {
  for (const slug of [
    'openrouter/auto',
    '~openai/gpt-4o',
    'gemini-2.5-flash',
    'google/gemini-latest',
    'google/gemini:latest',
    'latest/model',
    ''
  ]) {
    assert.throws(() => validateModelSlug(slug), OcrConfigurationError, `should reject ${slug}`)
  }
})

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

test('configuration fails loudly when the API key is missing', () => {
  assert.throws(
    () => loadOcrConfig({ OPENROUTER_MODEL: 'google/gemini-2.5-flash' }),
    OcrConfigurationError
  )
})

test('extraction runs at temperature zero and fails closed on routing', () => {
  const config = loadOcrConfig(validEnv)

  assert.equal(config.temperature, 0)
  assert.equal(TEMPERATURE, 0)
  assert.equal(config.provider.require_parameters, true)
  assert.equal(config.provider.allow_fallbacks, false)
  assert.equal(config.provider.data_collection, 'deny')
})

test('an insecure or malformed base URL is rejected', () => {
  for (const baseUrl of ['http://openrouter.ai/api/v1', 'not-a-url', 'https://x.test/v1?key=1']) {
    assert.throws(
      () => loadOcrConfig({ ...validEnv, OPENROUTER_BASE_URL: baseUrl }),
      OcrConfigurationError
    )
  }
})

// ---------------------------------------------------------------------------
// Response contract
// ---------------------------------------------------------------------------

const completeExtraction = Object.fromEntries(OUTPUT_FIELDS.map((f) => [f, null]))

test('the schema is strict and covers exactly the prompt fields', () => {
  assert.equal(EXTRACTION_SCHEMA.additionalProperties, false)
  assert.deepEqual(EXTRACTION_SCHEMA.required, [...OUTPUT_FIELDS])
  assert.equal(RESPONSE_FORMAT.json_schema.strict, true)
})

test('a well-formed payload keeps its values and collapses blanks to null', () => {
  const validated = validateExtraction({
    ...completeExtraction,
    lot_number: 'A1234',
    name: '  Sterile Syringe 10mL  ',
    size: '   '
  })

  assert.equal(validated.lot_number, 'A1234')
  assert.equal(validated.name, '  Sterile Syringe 10mL  ', 'printed wording is preserved verbatim')
  assert.equal(validated.size, null, 'a blank string is an absent value, not an empty one')
})

test('a missing key becomes null rather than disappearing', () => {
  const validated = validateExtraction({ lot_number: 'A1234' })

  assert.deepEqual(Object.keys(validated), [...OUTPUT_FIELDS])
  assert.equal(validated.gtin, null)
})

test('a malformed payload is a visible failure, not an empty record', () => {
  for (const payload of [
    null,
    'a string',
    ['an array'],
    { ...completeExtraction, surprise_field: 'x' },
    { ...completeExtraction, quantity: 50 }
  ]) {
    assert.throws(() => validateExtraction(payload), ExtractionPayloadError)
  }
})

// ---------------------------------------------------------------------------
// Database mapping
// ---------------------------------------------------------------------------

test('no extracted field is silently dropped', () => {
  assert.deepEqual(unmappedFields(), [])
})

test('the printed barcode wins, and a standalone GTIN is the fallback', () => {
  const withBoth = toSubmissionColumns({
    ...completeExtraction,
    barcode: '(01)09327911001522(10)215476KS',
    gtin: '09327911001522'
  })
  assert.equal(withBoth.barcode, '(01)09327911001522(10)215476KS')

  const gtinOnly = toSubmissionColumns({ ...completeExtraction, gtin: '09327911001522' })
  assert.equal(gtinOnly.barcode, '09327911001522')

  const neither = toSubmissionColumns(completeExtraction)
  assert.equal(neither.barcode, null)
})

test('extraction fields are mapped onto their database columns', () => {
  const columns = toSubmissionColumns({
    ...completeExtraction,
    manufacture_date: '2024-03-01',
    expiration_date: '2029-03-01',
    lot_number: 'A1234',
    reference_number: 'REF-99'
  })

  assert.equal(columns.date_of_manufacture, '2024-03-01')
  assert.equal(columns.expiration, '2029-03-01')
  assert.equal(columns.lot, 'A1234')
  assert.equal(columns.ref, 'REF-99')
  assert.ok(!('udi' in columns), 'udi is extracted to protect barcode, but not stored')
})

// ---------------------------------------------------------------------------
// Provenance
// ---------------------------------------------------------------------------

test('the recorded prompt hash matches the prompt actually sent', () => {
  assert.equal(PROMPT_SHA256, createHash('sha256').update(PROMPT, 'utf8').digest('hex'))
  assert.equal(PROMPT_VERSION, 'medical-label-v5-boxhawk')
})

test('failures are categorised so recurring problems are distinguishable', () => {
  assert.equal(errorCategory(new OcrConfigurationError('x')), 'configuration')
  assert.equal(errorCategory(new ExtractionPayloadError('x')), 'invalid_response')
  assert.equal(errorCategory(Object.assign(new Error('x'), { name: 'TimeoutError' })), 'timeout')
  assert.equal(errorCategory(new Error('boom')), 'provider_error')
})
