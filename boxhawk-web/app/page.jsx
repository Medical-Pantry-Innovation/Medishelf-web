'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useRole } from '@/hooks/useRole'
import Link from 'next/link'

export default function HomePage() {
  const { userRole, loading, isAuthenticated } = useRole()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    pendingCount: 0,
    completedCount: 0,
    rejectedCount: 0,
    upNext: []
  })
  const [recentCompleted, setRecentCompleted] = useState([])
  const [loadingStats, setLoadingStats] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get current user
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
      }
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (userRole === 'expert') {
      loadStats()
    } else {
      setLoadingStats(false)
    }
  }, [userRole])

  const loadStats = async () => {
    try {
      setLoadingStats(true)
      const hasMeaningfulError = (err) =>
        !!(err && Object.values(err).some((value) => value !== null && value !== undefined && value !== ''))
      
      // Get pending count (status == 'in_review')
      const { count: pendingCountRaw, error: pendingError } = await supabase
        .from('photo_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_review')

      const pendingCount = pendingCountRaw || 0
      if (hasMeaningfulError(pendingError)) {
        console.error('Pending stats error:', pendingError)
      }

      // Get completed count (status == 'complete')
      const { count: completedCount } = await supabase
        .from('photo_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'complete')

      // Get rejected count
      const { count: rejectedCount, error: rejectedCountError } = await supabase
        .from('photo_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected')

      if (hasMeaningfulError(rejectedCountError)) {
        console.error('Rejected count error:', rejectedCountError)
      }

      // Get next 2 pending items for "Up Next in Queue"
      const { data: upNextData, error: upNextError } = await supabase
        .from('photo_submissions')
        .select('id, name, manufacturer')
        .eq('status', 'in_review')
        .order('created_at', { ascending: true })
        .limit(2)

      if (hasMeaningfulError(upNextError)) {
        console.error('Up next stats error:', upNextError)
      }

      // Get recently processed items (last 10)
      const { data: completedItems, error: completedError } = await supabase
        .from('photo_submissions')
        .select('id, name, manufacturer, updated_at, status')
        .eq('status', 'complete')
        .order('updated_at', { ascending: false })
        .limit(10)

      const { data: rejectedItems, error: rejectedError } = await supabase
        .from('photo_submissions')
        .select('id, name, manufacturer, updated_at, status')
        .eq('status', 'rejected')
        .order('updated_at', { ascending: false })
        .limit(10)

      if (hasMeaningfulError(completedError)) {
        console.error('Completed stats error:', completedError)
      }
      if (hasMeaningfulError(rejectedError)) {
        console.error('Rejected stats error:', rejectedError)
      }

      const combinedProcessed = [
        ...(completedItems || []),
        ...(rejectedItems || [])
      ]
        .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
        .slice(0, 10)

      setStats({
        pendingCount: pendingCount || 0,
        completedCount: completedCount || 0,
        rejectedCount: rejectedCount || 0,
        upNext: upNextData || []
      })
      setRecentCompleted(combinedProcessed)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleStartNextReview = async () => {
    try {
      // Find next pending item
      const { data: nextItems, error } = await supabase
        .from('photo_submissions')
        .select('id')
        .eq('status', 'in_review')
        .order('created_at', { ascending: true })
        .limit(1)

      if (error || !nextItems || nextItems.length === 0) {
        alert('No pending items to review!')
        return
      }

      router.push(`/items/${nextItems[0].id}`)
    } catch (error) {
      console.error('Error finding next item:', error)
      alert('Failed to find next item')
    }
  }

  if (loading || loadingStats) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to landing page for unauthenticated users
    window.location.href = '/home'
    return null
  }

  // Redirect admin users to admin dashboard
  if (userRole === 'admin' || userRole === 'superadmin') {
    window.location.href = '/admin'
    return null
  }

  // For expert users, show new dashboard
  if (userRole === 'expert') {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 24px 40px 24px'
      }}>
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: '8px',
              margin: 0
            }}>
              Dashboard
            </h1>
            <p style={{
              fontSize: '16px',
              color: '#666',
              margin: 0
            }}>
              These are things we need your help with.
            </p>
          </div>

          <button
            onClick={handleStartNextReview}
            style={{
              padding: '12px 24px',
              backgroundColor: '#1a1a1a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#333333'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1a1a1a'
            }}
          >
            <span>►</span>
            Start Next Review
          </button>
        </div>

        {/* Summary Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Pending Reviews
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1a1a1a'
            }}>
              {stats.pendingCount}
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Rejected
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1a1a1a'
            }}>
              {stats.rejectedCount}
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '8px',
              fontWeight: '500'
            }}>
              Completed
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: '700',
              color: '#1a1a1a'
            }}>
              {stats.completedCount}
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#666',
              marginBottom: '12px',
              fontWeight: '500'
            }}>
              Up Next in Queue
            </div>
            {stats.upNext.length > 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                {stats.upNext.map((item) => (
                  <div key={item.id} style={{
                    fontSize: '14px',
                    color: '#1a1a1a',
                    fontWeight: '500'
                  }}>
                    {item.name} {item.manufacturer ? `(${item.manufacturer})` : ''}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                fontSize: '14px',
                color: '#999',
                fontStyle: 'italic'
              }}>
                No items in queue
              </div>
            )}
          </div>
        </div>

        {/* Recently Completed Review */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#1a1a1a',
            margin: '0 0 20px 0'
          }}>
            Recently Processed Items
          </h2>

          {recentCompleted.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e9ecef' }}>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#666'
                    }}>
                      PRODUCT NAME
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#666'
                    }}>
                      DATE REVIEWED
                    </th>
                    <th style={{
                      textAlign: 'left',
                      padding: '12px 0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#666'
                    }}>
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentCompleted.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{
                        padding: '12px 0',
                        fontSize: '14px',
                        color: '#1a1a1a'
                      }}>
                        {item.name}
                      </td>
                      <td style={{
                        padding: '12px 0',
                        fontSize: '14px',
                        color: '#666'
                      }}>
                        {new Date(item.updated_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 0' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: item.status === 'rejected' ? '#fee2e2' : '#d4edda',
                          color: item.status === 'rejected' ? '#b91c1c' : '#155724'
                        }}>
                          {item.status === 'rejected' ? 'Rejected' : 'Approved'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#999',
              fontSize: '14px'
            }}>
              No completed reviews yet
            </div>
          )}
        </div>
      </div>
    )
  }

  // For photouser, show original cards
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f6fb',
      padding: '64px 24px'
    }}>
      <div style={{
        maxWidth: '520px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px'
      }}>
        <div style={{
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.08)'
        }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🦅</div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '4px'
          }}>
            Welcome back!
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginBottom: '16px'
          }}>
            {user?.email}
          </p>
          <div style={{
            display: 'inline-block',
            padding: '6px 14px',
            backgroundColor: '#22c55e',
            color: 'white',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            Photo User
          </div>
        </div>

        <Link href="/photo/upload" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 40%, #a855f7 100%)',
            borderRadius: '24px',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            boxShadow: '0 18px 45px rgba(29, 78, 216, 0.28)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            cursor: 'pointer'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '18px',
              backgroundColor: 'rgba(15, 23, 42, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px'
            }}>
              📷
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                Upload Photos
              </h2>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '8px' }}>
                Tap to start capturing a new product
              </span>
            </div>
          </div>
        </Link>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          padding: '28px',
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.05)',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '700',
            marginBottom: '16px',
            background: 'linear-gradient(90deg, #1d4ed8 0%, #c026d3 50%, #fb7185 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Medi Mate
          </h3>
          <p style={{
            fontSize: '15px',
            color: '#374151',
            lineHeight: 1.7
          }}>
            Thanks for being such a legend! We need at least four clear photos of each medical
            product—front, back, and both sides—so our experts can capture every detail.
            The more photos the better.
          </p>
        </div>
      </div>
    </div>
  )
}