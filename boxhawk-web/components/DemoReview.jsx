'use client'

import { useState } from 'react'
import Link from 'next/link'

import {
  ExtractionField,
  ExtractionProvenance,
  REVIEW_FIELDS
} from './ExtractionFields'

/**
 * A walkthrough of the review screen on one sample submission.
 *
 * The values shown here were produced by running lib/ocr over a fixed payload
 * on the server — see app/items/demo/page.jsx. Nothing on this page calls a
 * model or the database, so it runs with no API key and no Supabase project.
 */

/** What a reader that fills every field would have put in the four blanks. */
const GUESSES = {
  date_of_manufacture: { value: '2026-10-31', why: 'never printed on this carton' },
  sponsor: { value: 'Vantyn Medical Pty Ltd', why: 'the manufacturer, repeated' }
}

export default function DemoReview({ images, extraction, columns, meta, rawPayload }) {
  const [formData, setFormData] = useState(columns)
  const [showGuesses, setShowGuesses] = useState(false)
  const [showPipeline, setShowPipeline] = useState(false)
  const [zoom, setZoom] = useState(100)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const extractedColumns = showGuesses
    ? { ...columns, ...Object.fromEntries(Object.entries(GUESSES).map(([k, g]) => [k, g.value])) }
    : columns

  const shownForm = showGuesses
    ? { ...formData, ...Object.fromEntries(Object.entries(GUESSES).map(([k, g]) => [k, g.value])) }
    : formData

  const blanks = REVIEW_FIELDS.filter((f) => columns[f.name] === null).length

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>

      <div style={{ marginBottom: '16px' }}>
        <Link
          href="/items"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            fontSize: '14px'
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: '#d6dcff',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              color: '#4f46e5',
              fontWeight: '600'
            }}
          >
            ←
          </span>
          <span style={{ fontWeight: '600', color: '#4f46e5' }}>Back to Review Queue</span>
        </Link>
      </div>

      {/* Sample banner — this must never be mistaken for a live extraction. */}
      <div
        style={{
          border: '1px solid #fde68a',
          backgroundColor: '#fffbeb',
          color: '#92400e',
          borderRadius: '8px',
          padding: '12px 14px',
          marginBottom: '20px',
          fontSize: '13px',
          lineHeight: 1.6
        }}
      >
        <strong style={{ fontWeight: '600' }}>Sample submission.</strong>{' '}
        The product, manufacturer and label image are invented. The field values below were produced
        by running the real extraction rules over a fixed response, so the screen is live but the
        reading is not — no model was called and no record was loaded.
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '3fr 2fr',
          gap: '24px',
          alignItems: 'flex-start'
        }}
      >

        {/* Left — the photographs the volunteer submitted */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#101828', margin: 0 }}>
              Submitted photographs
            </h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(60, z - 20))}
                style={zoomButtonStyle}
              >
                −
              </button>
              <span style={{ fontSize: '14px', color: '#666', minWidth: '50px', textAlign: 'center' }}>
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(200, z + 20))}
                style={zoomButtonStyle}
              >
                +
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {images.map((src) => (
              <div
                key={src}
                style={{
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  overflow: 'auto',
                  backgroundColor: '#f9fafb'
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt="Sample medical device carton label"
                  style={{ display: 'block', width: `${zoom}%`, maxWidth: 'none' }}
                />
              </div>
            ))}
          </div>

          <p style={{ fontSize: '13px', color: '#667085', marginTop: '16px', lineHeight: 1.6 }}>
            Replace the files in <code style={codeStyle}>public/demo/</code> to walk through this
            screen with real Medical Pantry photographs.
          </p>
        </div>

        {/* Right — the review form */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <h2
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#101828',
              margin: '0 0 16px'
            }}
          >
            Item details
          </h2>

          <ExtractionProvenance
            meta={meta}
            fields={REVIEW_FIELDS.map((f) => f.name)}
            extraction={columns}
          />

          <div
            style={{
              border: '1px solid #e9ecef',
              borderLeft: '3px solid #dc2626',
              borderRadius: '8px',
              padding: '12px 14px',
              marginBottom: '20px'
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#101828',
                cursor: 'pointer'
              }}
            >
              <input
                id="demo-show-guesses"
                type="checkbox"
                checked={showGuesses}
                onChange={(e) => setShowGuesses(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#dc2626', cursor: 'pointer' }}
              />
              Fill the blanks the way a guessing reader would
            </label>
            <p style={{ fontSize: '13px', color: '#667085', margin: '8px 0 0', lineHeight: 1.6 }}>
              {showGuesses
                ? 'Every field now looks complete. Two of these values were never printed on the carton — a reviewer has no way to tell which.'
                : `${blanks} fields came back empty because the packaging does not carry them. That is the designed behaviour, not a failure.`}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
            {REVIEW_FIELDS.map((field) => (
              <ExtractionField
                key={field.name}
                name={field.name}
                label={field.label}
                required={field.required}
                multiline={field.multiline}
                value={shownForm[field.name] ?? ''}
                extracted={extractedColumns[field.name]}
                onChange={handleInputChange}
              />
            ))}
          </div>

          {/* The library's own steps, so the screen can be traced back to code. */}
          <div style={{ marginTop: '24px', borderTop: '1px solid #e9ecef', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={() => setShowPipeline((v) => !v)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '14px',
                fontWeight: '600',
                color: '#4f46e5',
                cursor: 'pointer'
              }}
            >
              {showPipeline ? 'Hide' : 'Show'} what lib/ocr did with the response
            </button>

            {showPipeline && (
              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <PipelineStep
                  step="1"
                  title="The model's reply"
                  note="Shape guaranteed by the JSON schema sent with the request — fifteen keys, strings or null."
                  body={rawPayload}
                />
                <PipelineStep
                  step="2"
                  title="validateExtraction()"
                  note="Rejects unknown keys and non-strings; collapses blank strings to null so an empty value cannot pass as a reading."
                  body={JSON.stringify(extraction, null, 2)}
                />
                <PipelineStep
                  step="3"
                  title="toSubmissionColumns()"
                  note="Maps the fifteen extracted fields onto the thirteen photo_submissions columns. gtin falls back into barcode; udi is deliberately not stored."
                  body={JSON.stringify(columns, null, 2)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PipelineStep({ step, title, note, body }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: '700',
            color: '#4f46e5',
            backgroundColor: '#eef2ff',
            borderRadius: '4px',
            padding: '1px 6px'
          }}
        >
          {step}
        </span>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#101828' }}>{title}</span>
      </div>
      <p style={{ fontSize: '12.5px', color: '#667085', margin: '0 0 8px', lineHeight: 1.6 }}>{note}</p>
      <pre
        style={{
          margin: 0,
          padding: '12px',
          backgroundColor: '#f9fafb',
          border: '1px solid #e9ecef',
          borderRadius: '6px',
          fontSize: '12px',
          lineHeight: 1.6,
          overflowX: 'auto',
          color: '#344054'
        }}
      >
        {body}
      </pre>
    </div>
  )
}

const zoomButtonStyle = {
  width: '32px',
  height: '32px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  backgroundColor: '#fff',
  cursor: 'pointer',
  fontSize: '18px',
  color: '#333'
}

const codeStyle = {
  backgroundColor: '#f2f4f7',
  borderRadius: '3px',
  padding: '1px 5px',
  fontSize: '12px'
}
