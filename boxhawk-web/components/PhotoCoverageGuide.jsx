const captureSteps = [
  {
    label: 'Front label',
    detail: 'Product name and manufacturer'
  },
  {
    label: 'Back label',
    detail: 'Instructions and product details'
  },
  {
    label: 'Barcode or identifier',
    detail: 'GTIN, UDI, barcode or reference number'
  },
  {
    label: 'Dates and lot',
    detail: 'Expiry, manufacture date and lot or batch number'
  }
]

export function captureLabel(index) {
  return captureSteps[index]?.label || `Additional view ${index - captureSteps.length + 1}`
}

export function nextCaptureLabel(photoCount) {
  return captureSteps[photoCount]?.label || 'Any additional useful view'
}

export default function PhotoCoverageGuide({ photoCount }) {
  return (
    <section aria-labelledby="photo-guide-title" style={{
      backgroundColor: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: '16px',
      padding: '18px',
      marginBottom: '20px',
      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '14px'
      }}>
        <div>
          <h2 id="photo-guide-title" style={{
            margin: 0,
            color: '#111827',
            fontSize: '17px',
            fontWeight: '700'
          }}>
            Suggested photo order
          </h2>
          <p style={{ margin: '5px 0 0', color: '#6b7280', fontSize: '13px', lineHeight: 1.45 }}>
            Photograph one product only. Follow this order where possible.
          </p>
        </div>
        <span style={{
          flexShrink: 0,
          padding: '5px 10px',
          borderRadius: '999px',
          backgroundColor: photoCount >= captureSteps.length ? '#dcfce7' : '#eef2ff',
          color: photoCount >= captureSteps.length ? '#166534' : '#4338ca',
          fontSize: '12px',
          fontWeight: '700'
        }}>
          {Math.min(photoCount, captureSteps.length)}/{captureSteps.length} core photos
        </span>
      </div>

      <div style={{ display: 'grid', gap: '9px' }}>
        {captureSteps.map((step, index) => {
          const complete = index < photoCount
          const current = index === photoCount
          return (
            <div key={step.label} style={{
              display: 'grid',
              gridTemplateColumns: '28px minmax(0, 1fr)',
              gap: '10px',
              alignItems: 'center',
              padding: '9px 11px',
              borderRadius: '12px',
              backgroundColor: complete ? '#f0fdf4' : current ? '#eef2ff' : '#f9fafb',
              border: `1px solid ${complete ? '#bbf7d0' : current ? '#c7d2fe' : '#f3f4f6'}`
            }}>
              <span aria-hidden style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: complete ? '#16a34a' : current ? '#4f46e5' : '#e5e7eb',
                color: complete || current ? '#ffffff' : '#6b7280',
                fontSize: '12px',
                fontWeight: '700'
              }}>
                {complete ? '✓' : index + 1}
              </span>
              <span>
                <strong style={{ display: 'block', color: '#1f2937', fontSize: '13px' }}>{step.label}</strong>
                <span style={{ color: '#6b7280', fontSize: '12px' }}>{step.detail}</span>
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
