/**
 * Validated extraction configuration, read from the environment.
 *
 * The model-slug rules are carried over from the MediScan evaluation harness.
 * Their purpose is reproducibility: a floating alias can silently change which
 * model version is served, which makes a stored result impossible to interpret
 * later. Failing at startup is preferable to discovering it afterwards.
 */

export const DEFAULT_BASE_URL = 'https://openrouter.ai/api/v1'
export const DEFAULT_TIMEOUT_MS = 60_000

/** Fixed, not configurable: a non-zero temperature makes results irreproducible. */
export const TEMPERATURE = 0

export class OcrConfigurationError extends Error {
  name = 'OcrConfigurationError'
}

/**
 * Reject model slugs that cannot identify one fixed model version.
 *
 * @param {string} model
 */
export function validateModelSlug(model) {
  const slug = (model ?? '').trim()

  if (!slug) {
    throw new OcrConfigurationError('Model is not configured; set OPENROUTER_MODEL')
  }
  if (slug.toLowerCase() === 'openrouter/auto') {
    throw new OcrConfigurationError('openrouter/auto does not identify a fixed model')
  }
  if (slug.startsWith('~')) {
    throw new OcrConfigurationError(
      `OPENROUTER_MODEL must not use a "~" floating-alias route: ${slug}`
    )
  }
  if (!slug.includes('/')) {
    throw new OcrConfigurationError(
      `OPENROUTER_MODEL must be an explicit provider/model slug: ${slug}`
    )
  }
  // "latest" as a delimited component anywhere in the slug, not just a trailing
  // "/latest" — providers use different delimiters for the same moving alias.
  if (/(?:^|[/:_.-])latest(?:$|[/:_.-])/i.test(slug)) {
    throw new OcrConfigurationError(`OPENROUTER_MODEL must not use a "latest" alias: ${slug}`)
  }
  return slug
}

/**
 * @param {string} baseUrl
 */
function validateBaseUrl(baseUrl) {
  let parsed
  try {
    parsed = new URL(baseUrl)
  } catch {
    throw new OcrConfigurationError(`OPENROUTER_BASE_URL is not a valid URL: ${baseUrl}`)
  }
  if (parsed.protocol !== 'https:' || parsed.search || parsed.hash) {
    throw new OcrConfigurationError(
      'OPENROUTER_BASE_URL must be an HTTPS URL without query or fragment'
    )
  }
  return baseUrl
}

/**
 * @param {string|undefined} value
 */
function parseTimeout(value) {
  if (value === undefined || value.trim() === '') return DEFAULT_TIMEOUT_MS
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new OcrConfigurationError('OPENROUTER_TIMEOUT_MS must be a number greater than zero')
  }
  return parsed
}

/**
 * Build the validated configuration for one extraction call.
 *
 * @param {Record<string, string|undefined>} [env]
 */
export function loadOcrConfig(env = process.env) {
  const apiKey = (env.OPENROUTER_API_KEY ?? '').trim()
  if (!apiKey) {
    throw new OcrConfigurationError('API key is not configured; set OPENROUTER_API_KEY')
  }

  return {
    apiKey,
    model: validateModelSlug(env.OPENROUTER_MODEL),
    baseUrl: validateBaseUrl((env.OPENROUTER_BASE_URL ?? DEFAULT_BASE_URL).trim()),
    timeoutMs: parseTimeout(env.OPENROUTER_TIMEOUT_MS),
    temperature: TEMPERATURE,
    // Routing policy. require_parameters makes the request fail closed rather
    // than letting an endpoint silently drop temperature or the output schema.
    provider: {
      require_parameters: true,
      allow_fallbacks: false,
      data_collection: 'deny'
    }
  }
}

/**
 * Classify a failure for logging, so recurring problems are distinguishable.
 *
 * @param {unknown} error
 */
export function errorCategory(error) {
  const name = error instanceof Error ? error.name.toLowerCase() : ''
  const message = error instanceof Error ? error.message.toLowerCase() : ''

  if (name.includes('timeout') || name.includes('abort')) return 'timeout'
  if (name === 'ocrconfigurationerror') return 'configuration'
  if (name === 'extractionpayloaderror' || message.includes('json')) return 'invalid_response'
  if (name.includes('typeerror')) return 'network_or_configuration'
  return 'provider_error'
}
