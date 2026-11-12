'use client'

import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

import { REVIEW_FIELDS } from './ExtractionFields'

/**
 * Shows the volunteer what was read off the packaging they just photographed.
 *
 * The extraction used to run from the upload page and was thrown away: the
 * call was fired after the redirect and its result only reached console.log.
 * Running it here instead means the work is visible to the person who did it,
 * and the upload itself still completes without waiting.
 *
 * Whatever happens here, the submission is already saved — so a failure is
 * reported quietly and never as a failed upload.
 */
export default function UploadExtractionSummary() {
  const searchParams = useSearchParams()
  const submissionId = searchParams.get('submission')

  const [state, setState] = useState('idle') // idle | reading | done | failed
  const [columns, setColumns] = useState(null)
  const [message, setMessage] = useState(null)
  const started = useRef(false)

  useEffect(() => {
    if (!submissionId || started.current) return
    started.current = true

    setState('reading')

    fetch('/api/photo-submissions/ai-image-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission_id: submissionId })
    })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Extraction failed')
        setColumns(data.columns)
        setState('done')
      })
      .catch((err) => {
        setMessage(err.message)
        setState('failed')
      })
  }, [submissionId])

  if (!submissionId || state === 'idle') return null

  return (
    <div
      style={{
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto 32px',
        backgroundColor: '#ffffff',
        border: '1px solid #e9ecef',
        borderRadius: '16px',
        padding: '20px 22px',
        textAlign: 'left',
        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)'
      }}
    >
      {state === 'reading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Spinner />
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#101828' }}>
            Reading the label…
          </span>
        </div>
      )}

      {state === 'failed' && (
        <>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#101828', marginBottom: '6px' }}>
            Your photos are saved
          </div>
          <p style={{ fontSize: '13.5px', color: '#667085', margin: 0, lineHeight: 1.6 }}>
            The label could not be read automatically, so a reviewer will enter the details.
            Nothing is lost.
            {message ? <span style={{ display: 'block', marginTop: '6px', color: '#98a2b3' }}>{message}</span> : null}
          </p>
        </>
      )}

      {state === 'done' && columns && <ReadFields columns={columns} />}
    </div>
  )
}

function ReadFields({ columns }) {
  const read = REVIEW_FIELDS.filter((f) => columns[f.name])
  const blank = REVIEW_FIELDS.length - read.length

  return (
    <>
      <div style={{ fontSize: '15px', fontWeight: '600', color: '#101828', marginBottom: '4px' }}>
        Read from your photos
      </div>
      <p style={{ fontSize: '13px', color: '#667085', margin: '0 0 14px', lineHeight: 1.6 }}>
        {read.length} of {REVIEW_FIELDS.length} details came off the packaging.
        {blank > 0 && ` ${blank} weren't printed on it — a reviewer will confirm those.`}
      </p>

      <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {read.map((field) => (
          <div
            key={field.name}
            style={{
              display: 'grid',
              gridTemplateColumns: '130px minmax(0, 1fr)',
              gap: '12px',
              alignItems: 'baseline'
            }}
          >
            <dt style={{ fontSize: '12.5px', color: '#98a2b3' }}>{field.label}</dt>
            <dd
              style={{
                margin: 0,
                fontSize: '13.5px',
                color: '#101828',
                wordBreak: 'break-word'
              }}
            >
              {columns[field.name]}
            </dd>
          </div>
        ))}
      </dl>
    </>
  )
}

function Spinner() {
  return (
    <>
      <span
        aria-hidden="true"
        style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          border: '2px solid #e9ecef',
          borderTopColor: '#6c5ce7',
          display: 'inline-block',
          animation: 'boxhawk-spin 0.8s linear infinite',
          flexShrink: 0
        }}
      />
      <style>{`
        @keyframes boxhawk-spin { to { transform: rotate(360deg) } }
        @media (prefers-reduced-motion: reduce) {
          [style*="boxhawk-spin"] { animation: none !important }
        }
      `}</style>
    </>
  )
}
