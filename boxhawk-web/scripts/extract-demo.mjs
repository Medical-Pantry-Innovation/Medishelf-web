#!/usr/bin/env node
/**
 * Run the extraction rules against local image files.
 *
 *   node scripts/extract-demo.mjs photo-front.jpg photo-back.jpg
 *
 * Needs no database, no login, and no running application — only the images
 * and OPENROUTER_API_KEY / OPENROUTER_MODEL in the environment.
 *
 * With --dry-run it makes no network call at all, and prints the exact request
 * that would be sent. That is useful when no key is available.
 */

import { readFile } from 'node:fs/promises'
import { basename, extname } from 'node:path'

import {
  PROMPT,
  PROMPT_VERSION,
  PROMPT_SHA256,
  OUTPUT_FIELDS,
  RESPONSE_FORMAT,
  validateExtraction,
  loadOcrConfig,
  errorCategory,
  toSubmissionColumns
} from '../lib/ocr/index.mjs'

const MIME_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
}

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const files = args.filter((arg) => !arg.startsWith('--'))

if (files.length === 0) {
  console.error('Usage: node scripts/extract-demo.mjs [--dry-run] <image> [image ...]')
  process.exit(2)
}

/** Read one local image as a data URL, so no upload or public bucket is needed. */
async function toDataUrl(path) {
  const ext = extname(path).toLowerCase()
  const mime = MIME_BY_EXT[ext]
  if (!mime) throw new Error(`Unsupported image type "${ext}" for ${path}`)
  const base64 = (await readFile(path)).toString('base64')
  return `data:${mime};base64,${base64}`
}

function printTable(extraction) {
  const width = Math.max(...OUTPUT_FIELDS.map((f) => f.length))
  console.log('')
  for (const field of OUTPUT_FIELDS) {
    const value = extraction[field]
    const shown = value === null ? '— not readable on the label' : value
    console.log(`  ${field.padEnd(width)}  ${shown}`)
  }
  const found = OUTPUT_FIELDS.filter((f) => extraction[f] !== null).length
  console.log(`\n  ${found} of ${OUTPUT_FIELDS.length} fields read from the label.`)
}

async function main() {
  let config
  try {
    config = loadOcrConfig()
  } catch (err) {
    if (!dryRun) {
      console.error(`Configuration error: ${err.message}`)
      console.error('Re-run with --dry-run to inspect the request without calling the model.')
      process.exit(1)
    }
    config = null
  }

  const imageUrls = await Promise.all(files.map(toDataUrl))

  console.log(`Prompt      ${PROMPT_VERSION}  (sha256 ${PROMPT_SHA256.slice(0, 16)}…)`)
  console.log(`Model       ${config ? config.model : '(not configured)'}`)
  console.log(`Temperature ${config ? config.temperature : 0}  — fixed, so runs are reproducible`)
  console.log(`Images      ${files.map((f) => basename(f)).join(', ')}`)
  console.log(`Output      strict JSON schema, ${OUTPUT_FIELDS.length} fields, enforced by the provider`)

  if (dryRun || !config) {
    console.log('\n--dry-run: no request sent. Schema that the response must satisfy:')
    console.log(JSON.stringify(RESPONSE_FORMAT.json_schema.schema.properties, null, 2))
    console.log(`\nPrompt is ${PROMPT.length} characters; read it in lib/ocr/prompt.mjs`)
    return
  }

  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl })

  const startedAt = Date.now()
  const completion = await client.chat.completions.create(
    {
      model: config.model,
      temperature: config.temperature,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            ...imageUrls.map((url) => ({ type: 'image_url', image_url: { url } }))
          ]
        }
      ],
      response_format: RESPONSE_FORMAT,
      provider: config.provider
    },
    { timeout: config.timeoutMs }
  )

  const extraction = validateExtraction(JSON.parse(completion.choices[0].message.content))

  printTable(extraction)
  console.log(`  Took ${((Date.now() - startedAt) / 1000).toFixed(1)}s`)
  console.log('\nColumns that would be written to photo_submissions:')
  console.log(JSON.stringify(toSubmissionColumns(extraction), null, 2))
}

main().catch((err) => {
  console.error(`Extraction failed [${errorCategory(err)}]: ${err.message}`)
  process.exit(1)
})
