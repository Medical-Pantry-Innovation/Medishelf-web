'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function SuccessPage() {
  const [showComments, setShowComments] = useState(false)

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f5f6ff 0%, #f9fafb 40%, #ffffff 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 24px'
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '480px',
        width: '100%'
      }}>
        <div style={{
          width: '112px',
          height: '112px',
          margin: '0 auto 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '72px'
        }}>
          🦅
        </div>

        <h1 style={{
          fontSize: '56px',
          fontWeight: '800',
          marginBottom: '16px',
          letterSpacing: '-0.04em',
          textTransform: 'uppercase',
          background: 'linear-gradient(90deg, #6c5ce7 0%, #ef4444 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Success!
        </h1>

        <p style={{
          fontSize: '18px',
          color: '#475467',
          marginBottom: '36px',
          lineHeight: 1.6
        }}>
          Thanks for being a Pantry Mate and helping us capture every detail. Your photos keep our records accurate and get supplies to the people who need them.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          width: '100%',
          maxWidth: '300px',
          margin: '0 auto'
        }}>
          <Link href="/" style={{
            display: 'block',
            padding: '16px',
            backgroundColor: '#101828',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '999px',
            fontSize: '16px',
            fontWeight: '600',
            textAlign: 'center',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}>
            Back to Home
          </Link>
          
          <Link href="/photo/upload" style={{
            display: 'block',
            padding: '16px',
            backgroundColor: 'white',
            color: '#101828',
            textDecoration: 'none',
            borderRadius: '999px',
            fontSize: '16px',
            fontWeight: '600',
            textAlign: 'center',
            border: '1px solid #d0d5dd',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}>
            Continue Scanning
          </Link>

          <Link href="/photo/history" style={{
            display: 'block',
            padding: '12px',
            color: '#4f46e5',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '700',
            textAlign: 'center'
          }}>
            View upload status
          </Link>
        </div>
      </div>

      {/* Comments Section */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 10
      }}>
        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#6c5ce7',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(108, 92, 231, 0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          💬
        </button>
      </div>

      {/* Comments Panel */}
      {showComments && (
        <div style={{
          position: 'fixed',
          bottom: '80px',
          right: '20px',
          width: '320px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e9ecef',
          zIndex: 20
        }}>
          {/* Comments Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #e9ecef',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: '#333'
            }}>
              Comment
            </h3>
            <button
              onClick={() => setShowComments(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ×
            </button>
          </div>

          {/* Comments Content */}
          <div style={{
            padding: '16px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {/* Comment 1 */}
            <div style={{
              marginBottom: '16px',
              paddingBottom: '16px',
              borderBottom: '1px solid #f1f3f4'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#007bff',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginRight: '8px'
                }}>
                  J
                </div>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Julie Dao
                </span>
              </div>
              <p style={{
                fontSize: '12px',
                color: '#666',
                margin: '0 0 8px 0'
              }}>
                6 days ago
              </p>
              <p style={{
                fontSize: '14px',
                color: '#333',
                margin: 0,
                lineHeight: '1.4'
              }}>
                If you can - have an animation fantastic work.
              </p>
            </div>

            {/* Comment 2 */}
            <div style={{
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#007bff',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: '600',
                  marginRight: '8px'
                }}>
                  J
                </div>
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  Julie Dao
                </span>
              </div>
              <p style={{
                fontSize: '12px',
                color: '#666',
                margin: '0 0 8px 0'
              }}>
                6 days ago
              </p>
              <p style={{
                fontSize: '14px',
                color: '#333',
                margin: 0,
                lineHeight: '1.4'
              }}>
                Animation and go back to camera to take more photos.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

