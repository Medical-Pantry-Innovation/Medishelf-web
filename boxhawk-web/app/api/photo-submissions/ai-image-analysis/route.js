import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

import {
  PROMPT,
  PROMPT_VERSION,
  PROMPT_SHA256,
  RESPONSE_FORMAT,
  validateExtraction,
  loadOcrConfig,
  validateModelSlug,
  errorCategory,
  toSubmissionColumns
} from '@/lib/ocr/index.mjs'

const IMAGE_BUCKET = 'mp-images'

// Supabase client, for reading the submission's images and writing the result back.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Build the message content: the versioned prompt, then every image of this
 * submission as another view of the same item.
 */
function buildContent(imageUrls) {
  return [
    { type: 'text', text: PROMPT },
    ...imageUrls.map((url) => ({ type: 'image_url', image_url: { url } }))
  ]
}

export async function POST(req) {
  let config
  try {
    config = loadOcrConfig()
  } catch (err) {
    // A misconfigured deployment is our fault, not the caller's, and it would
    // otherwise show up as an unexplained empty extraction.
    console.error('AI extraction configuration error:', err.message)
    return NextResponse.json(
      { error: err.message, category: errorCategory(err) },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()
    const submissionId = body?.submission_id

    if (!submissionId) {
      return NextResponse.json({ error: 'submission_id is required' }, { status: 400 })
    }

    // A caller may pin a different model, but it goes through the same slug
    // rules: no floating aliases, so the stored result stays interpretable.
    const model = body?.model ? validateModelSlug(body.model) : config.model

    // --------------------
    // 1. Image paths for this submission
    // --------------------
    const { data: images, error } = await supabase
      .from('photo_submission_images')
      .select('storage_path')
      .eq('submission_id', submissionId)

    if (error) throw error

    const imageUrls = (images ?? []).map(
      (img) => supabase.storage.from(IMAGE_BUCKET).getPublicUrl(img.storage_path).data.publicUrl
    )

    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: `No images found for submission ${submissionId}` },
        { status: 404 }
      )
    }

    // --------------------
    // 2. Call the model under the validated configuration
    // --------------------
    const openrouter = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseUrl })

    const completion = await openrouter.chat.completions.create(
      {
        model,
        temperature: config.temperature,
        messages: [{ role: 'user', content: buildContent(imageUrls) }],
        // Enforced by the provider: the response cannot omit a key, add one,
        // nest the object, or arrive wrapped in Markdown.
        response_format: RESPONSE_FORMAT,
        provider: config.provider
      },
      { timeout: config.timeoutMs }
    )

    const raw = completion.choices?.[0]?.message?.content

    let payload
    try {
      payload = JSON.parse(raw ?? '')
    } catch {
      // With a strict schema this should not happen; when it does, it is a
      // provider problem and must stay visible rather than becoming an empty row.
      console.error('AI extraction returned non-JSON content:', raw)
      return NextResponse.json(
        { error: 'Model did not return JSON', category: 'invalid_response' },
        { status: 502 }
      )
    }

    const extraction = validateExtraction(payload)

    // --------------------
    // 3. Store the mapped columns, with the provenance of this run
    // --------------------
    const columns = toSubmissionColumns(extraction)
    const extractedAt = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('photo_submissions')
      .update({
        ...columns,
        extraction_model: model,
        extraction_prompt_version: PROMPT_VERSION,
        extraction_prompt_sha256: PROMPT_SHA256,
        extracted_at: extractedAt
      })
      .eq('id', submissionId)

    if (updateError) throw updateError

    console.log(
      `AI extraction ok: submission=${submissionId} model=${model} prompt=${PROMPT_VERSION}`
    )

    // --------------------
    // 4. Return the extraction, with the provenance of the run that produced it
    // --------------------
    return NextResponse.json({
      id: submissionId,
      result: extraction,
      // The same values mapped onto photo_submissions columns, so the review
      // screen can fill its form without repeating the mapping in the browser.
      columns,
      extraction_meta: {
        model,
        prompt_version: PROMPT_VERSION,
        prompt_sha256: PROMPT_SHA256,
        image_count: imageUrls.length,
        extracted_at: extractedAt
      }
    })
  } catch (err) {
    const category = errorCategory(err)
    console.error(`AI extraction error [${category}]:`, err)

    return NextResponse.json(
      { error: err.message || 'Internal Server Error', category },
      { status: 500 }
    )
  }
}
