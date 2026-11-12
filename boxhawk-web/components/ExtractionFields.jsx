'use client'

/**
 * Renders the review form fields together with where each value came from.
 *
 * The extraction rules in lib/ocr return null for anything that could not be
 * read off the packaging. Before this component, a null and a value the
 * reviewer had deleted looked identical in the form: both were an empty input.
 * The badge beside each label is what makes that difference visible.
 */

const SOURCE_STYLES = {
  ai: { label: 'AI read', color: '#0f766e', background: '#ecfdf5', border: '#99f6e4' },
  blank: { label: 'not on label', color: '#b45309', background: '#fffbeb', border: '#fde68a' },
  edited: { label: 'edited', color: '#6c5ce7', background: '#f5f3ff', border: '#ddd6fe' },
  manual: { label: 'manual entry', color: '#475467', background: '#f9fafb', border: '#e9ecef' }
}

const labelStyle = {
  display: 'block',
  fontSize: '14px',
  fontWeight: '500',
  marginBottom: '6px',
  color: '#333'
}

const inputStyle = {
  width: '100%',
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: '4px',
  fontSize: '14px',
  outline: 'none'
}

export function SourceBadge({ source }) {
  const style = SOURCE_STYLES[source]
  if (!style) return null

  return (
    <span
      style={{
        display: 'inline-block',
        marginLeft: '8px',
        padding: '1px 7px',
        fontSize: '11px',
        fontWeight: '500',
        lineHeight: '16px',
        color: style.color,
        backgroundColor: style.background,
        border: `1px solid ${style.border}`,
        borderRadius: '10px',
        verticalAlign: 'middle',
        whiteSpace: 'nowrap'
      }}
    >
      {style.label}
    </span>
  )
}

/**
 * One labelled field.
 *
 * @param {object} props
 * @param {string} props.name      column name on photo_submissions
 * @param {string} props.label     what the reviewer reads
 * @param {string} props.value     current form value
 * @param {string|null} props.extracted  what the extraction returned, or null
 * @param {boolean} props.required
 * @param {boolean} props.multiline
 * @param {boolean} props.readOnly
 * @param {(e) => void} props.onChange
 */
export function ExtractionField({
  name,
  label,
  value,
  extracted,
  required = false,
  multiline = false,
  readOnly = false,
  onChange
}) {
  const current = value ?? ''
  const source = sourceOf(current, extracted)
  const isBlank = source === 'blank'

  const control = {
    ...inputStyle,
    backgroundColor: readOnly ? '#fcfcfd' : '#ffffff',
    borderColor: isBlank ? '#fde68a' : '#ddd',
    color: current === '' ? '#98a2b3' : '#101828',
    ...(multiline ? { resize: 'vertical' } : {})
  }

  return (
    <div>
      <label htmlFor={`field-${name}`} style={labelStyle}>
        {label}
        {required && <span style={{ color: '#dc2626' }}> *</span>}
        <SourceBadge source={source} />
      </label>

      {multiline ? (
        <textarea
          id={`field-${name}`}
          name={name}
          value={current}
          onChange={onChange}
          readOnly={readOnly}
          rows={4}
          placeholder={isBlank ? 'Not printed on the packaging — add it if you can read it' : ''}
          style={control}
        />
      ) : (
        <input
          id={`field-${name}`}
          type="text"
          name={name}
          value={current}
          onChange={onChange}
          readOnly={readOnly}
          required={required}
          placeholder={isBlank ? 'Not printed on the packaging' : ''}
          style={control}
        />
      )}
    </div>
  )
}

/**
 * Decide which badge a field earns.
 *
 * `extracted === undefined` means the field was never part of an extraction
 * (the reviewer's own fields, such as labels), so it gets no AI badge at all.
 */
export function sourceOf(current, extracted) {
  if (extracted === undefined) return 'manual'
  if (extracted === null) return current ? 'edited' : 'blank'
  return current === extracted ? 'ai' : 'edited'
}

/**
 * The provenance line: which model and which version of the instructions
 * produced the values now sitting in the form.
 */
export function ExtractionProvenance({ meta, fields, extraction, onRerun, rerunning, rerunError }) {
  const total = fields.length
  const read = fields.filter((f) => extraction?.[f] != null).length

  return (
    <div
      style={{
        border: '1px solid #e9ecef',
        borderRadius: '8px',
        backgroundColor: '#f9fafb',
        padding: '12px 14px',
        marginBottom: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px 20px',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '13px',
        color: '#475467'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
        <div style={{ fontWeight: '600', color: '#101828', fontSize: '14px' }}>
          {read} of {total} fields read from the packaging
        </div>
        {meta ? (
          <div style={{ wordBreak: 'break-word' }}>
            {meta.model} · {meta.prompt_version}
            {meta.extracted_at ? ` · ${formatWhen(meta.extracted_at)}` : ''}
          </div>
        ) : (
          <div>No extraction has been recorded for this submission yet.</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {rerunError && (
          <span style={{ color: '#b42318', maxWidth: '280px' }}>{rerunError}</span>
        )}
        {onRerun && (
          <button
            type="button"
            onClick={onRerun}
            disabled={rerunning}
            style={{
              padding: '8px 14px',
              backgroundColor: rerunning ? '#98a2b3' : '#1a1a1a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: rerunning ? 'default' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {rerunning ? 'Reading…' : 'Re-run extraction'}
          </button>
        )}
      </div>
    </div>
  )
}

function formatWhen(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/** The review form's fields, in the order the reviewer reads them. */
export const REVIEW_FIELDS = [
  { name: 'name', label: 'Product Name', required: true },
  { name: 'manufacturer', label: 'Manufacturer', required: true },
  { name: 'barcode', label: 'Barcode Number / GTIN' },
  { name: 'size', label: 'Size' },
  { name: 'date_of_manufacture', label: 'Date of Manufacture' },
  { name: 'expiration', label: 'Expiration' },
  { name: 'lot', label: 'Lot Number' },
  { name: 'ref', label: 'Reference Number' },
  { name: 'quantity', label: 'Quantity' },
  { name: 'manufacture_address', label: 'Manufacture Address' },
  { name: 'manufacture_site', label: 'Manufacture Site' },
  { name: 'sponsor', label: 'Sponsor' },
  { name: 'notes', label: 'Notes', multiline: true }
]
