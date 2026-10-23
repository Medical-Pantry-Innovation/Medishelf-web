'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import RoleGuard from '@/components/RoleGuard'
import { supabase } from '@/lib/supabaseClient'
import { fetchItemsWithImages } from '@/lib/itemsService'

const statusDetails = {
  complete: {
    label: 'Confirmed',
    background: '#dcfce7',
    color: '#166534',
    description: 'The product details have been reviewed.'
  },
  rejected: {
    label: 'Needs attention',
    background: '#fee2e2',
    color: '#991b1b',
    description: 'The reviewer could not confirm this product from the submitted information.'
  },
  in_review: {
    label: 'In review',
    background: '#fef3c7',
    color: '#92400e',
    description: 'The photos and extracted details are waiting for review.'
  },
  uploaded: {
    label: 'Processing',
    background: '#dbeafe',
    color: '#1e40af',
    description: 'The upload is being prepared for review.'
  }
}

function statusFor(value) {
  return statusDetails[value] || {
    label: 'Submitted',
    background: '#f3f4f6',
    color: '#374151',
    description: 'The submission has been received.'
  }
}

export default function PhotoHistoryPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  const loadItems = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      router.push('/login')
      return
    }

    const result = await fetchItemsWithImages({
      createdBy: session.user.id,
      limit: 50
    })

    if (result.error) {
      console.error('Unable to load submission history:', result.error)
      setError('Your uploads could not be loaded. Please try again.')
    } else {
      setItems(result.items)
    }
    setLoading(false)
  }, [router])

  useEffect(() => {
    const timer = window.setTimeout(loadItems, 0)
    return () => window.clearTimeout(timer)
  }, [loadItems])

  const confirmedCount = items.filter(item => item.status === 'complete').length
  const inReviewCount = items.filter(item => ['in_review', 'uploaded'].includes(item.status)).length

  return (
    <RoleGuard requiredRoles={['photouser', 'admin', 'superadmin']}>
      <div style={{ maxWidth: '920px', margin: '0 auto', padding: '20px 0 48px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '18px',
          marginBottom: '28px',
          flexWrap: 'wrap'
        }}>
          <div>
            <Link href="/" style={{ color: '#4f46e5', fontSize: '14px', fontWeight: '600' }}>
              ← Back to home
            </Link>
            <h1 style={{ margin: '12px 0 6px', color: '#111827', fontSize: '30px' }}>Your uploads</h1>
            <p style={{ margin: 0, color: '#6b7280', lineHeight: 1.55 }}>
              Follow each product from submission through expert review.
            </p>
          </div>
          <Link href="/photo/upload" style={{
            padding: '12px 18px',
            borderRadius: '999px',
            backgroundColor: '#111827',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '700'
          }}>
            Photograph another product
          </Link>
        </div>

        {!loading && !error && items.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
            gap: '10px',
            marginBottom: '20px'
          }}>
            {[
              ['Submitted', items.length, '#eef2ff', '#3730a3'],
              ['Confirmed', confirmedCount, '#dcfce7', '#166534'],
              ['In review', inReviewCount, '#fef3c7', '#92400e']
            ].map(([label, value, background, color]) => (
              <div key={label} style={{
                padding: '14px 10px',
                borderRadius: '14px',
                backgroundColor: background,
                color,
                textAlign: 'center'
              }}>
                <strong style={{ display: 'block', fontSize: '22px', lineHeight: 1.1 }}>{value}</strong>
                <span style={{ display: 'block', marginTop: '5px', fontSize: '12px', fontWeight: '700' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '56px 20px', textAlign: 'center', color: '#6b7280' }}>
            Loading your uploads…
          </div>
        ) : error ? (
          <div style={{
            padding: '24px',
            border: '1px solid #fecaca',
            borderRadius: '16px',
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            textAlign: 'center'
          }}>
            <p style={{ margin: '0 0 14px' }}>{error}</p>
            <button type="button" onClick={loadItems} style={{
              padding: '9px 15px',
              border: 0,
              borderRadius: '999px',
              backgroundColor: '#991b1b',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: '600'
            }}>
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div style={{
            padding: '52px 24px',
            border: '1px dashed #cbd5e1',
            borderRadius: '20px',
            backgroundColor: '#ffffff',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '38px', marginBottom: '12px' }}>📷</div>
            <h2 style={{ margin: '0 0 8px', color: '#111827', fontSize: '20px' }}>No uploads yet</h2>
            <p style={{ margin: '0 0 20px', color: '#6b7280' }}>
              Photograph a medical product to start your contribution history.
            </p>
            <Link href="/photo/upload" style={{ color: '#4f46e5', fontWeight: '700' }}>
              Start an upload
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '14px' }}>
            {items.map(item => {
              const status = statusFor(item.status)
              return (
                <article key={item.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '92px minmax(0, 1fr)',
                  gap: '16px',
                  padding: '14px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '18px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 8px 22px rgba(15, 23, 42, 0.05)'
                }}>
                  <div style={{
                    width: '92px',
                    height: '92px',
                    overflow: 'hidden',
                    borderRadius: '14px',
                    backgroundColor: '#f3f4f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.images[0]} alt="Submitted product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span aria-hidden style={{ fontSize: '30px' }}>📷</span>
                    )}
                  </div>
                  <div style={{ minWidth: 0, padding: '2px 0' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      flexWrap: 'wrap'
                    }}>
                      <h2 style={{
                        margin: 0,
                        color: '#111827',
                        fontSize: '17px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.name || 'Product details pending'}
                      </h2>
                      <span style={{
                        padding: '5px 10px',
                        borderRadius: '999px',
                        backgroundColor: status.background,
                        color: status.color,
                        fontSize: '12px',
                        fontWeight: '700'
                      }}>
                        {status.label}
                      </span>
                    </div>
                    <p style={{ margin: '7px 0', color: '#4b5563', fontSize: '13px', lineHeight: 1.45 }}>
                      {status.description}
                    </p>
                    <p style={{ margin: 0, color: '#9ca3af', fontSize: '12px' }}>
                      {item.images?.length || 0} photos · Submitted {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </RoleGuard>
  )
}
