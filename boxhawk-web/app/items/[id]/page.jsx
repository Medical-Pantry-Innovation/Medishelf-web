'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import {
  ExtractionField,
  ExtractionProvenance,
  REVIEW_FIELDS
} from '@/components/ExtractionFields'

export default function ItemDetailPage() {
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  // What the extraction wrote, snapshotted when the item loads, so the form
  // can show which values a person has since changed.
  const [extractionBaseline, setExtractionBaseline] = useState(null)
  const [extractionMeta, setExtractionMeta] = useState(null)
  const [rerunning, setRerunning] = useState(false)
  const [rerunError, setRerunError] = useState(null)
  // Walkthrough only: the values a reader that never returns null would invent.
  const [guesses, setGuesses] = useState({})
  const [showGuesses, setShowGuesses] = useState(false)
  const [imagesFromDetail, setImagesFromDetail] = useState([]) // array of public URLs
  const [imageRecords, setImageRecords] = useState([]) // [{id, path, url}]
  const [selectedImageIds, setSelectedImageIds] = useState(new Set())
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [modalImageUrl, setModalImageUrl] = useState('')
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()

  const itemId = params.id

  // /items/demo renders this same screen from the extraction rules instead of
  // from Supabase, so the walkthrough cannot drift from what reviewers see.
  const isDemo = itemId === 'demo'

  useEffect(() => {
    if (itemId) {
      fetchItem()
    }
  }, [itemId])

  const fetchItem = async () => {
    try {
      setLoading(true)
      setError(null)

      let data
      let recs = []

      if (isDemo) {
        const response = await fetch('/api/ocr/demo')
        if (!response.ok) {
          setError('Could not load the walkthrough')
          return
        }
        const demo = await response.json()
        data = demo.submission
        recs = demo.images
        setGuesses(demo.guesses || {})
      } else {
        // Read basic information directly from photo_submissions
        const { data: row, error } = await supabase
          .from('photo_submissions')
          .select('*')
          .eq('id', itemId)
          .single()

        if (error) {
          console.error('Error fetching item:', error)
          setError('Item not found')
          return
        }
        data = row

        // Load image details (including id) for this submission, for multi-select and batch operations
        const { data: imgs, error: imgsErr } = await supabase
          .from('photo_submission_images')
          .select('id, storage_path, status, created_at')
          .eq('submission_id', itemId)
          .eq('status', 'active')
          .order('created_at', { ascending: true })

        if (!imgsErr && Array.isArray(imgs)) {
          recs = imgs.map(it => ({
            id: it.id,
            path: it.storage_path,
            url: supabase.storage.from('mp-images').getPublicUrl(it.storage_path).data.publicUrl
          }))
        }
      }

      setItem(data)
      setImageRecords(recs)
      setImagesFromDetail(recs.map(r => r.url))
      
      // Check if there's form data from review page return
      const returnData = searchParams.get('returnData')
      let initialFormData = {
        name: data.name || '',
        manufacturer: data.manufacturer || '',
        barcode: data.barcode || '',
        size: data.size || '',
        date_of_manufacture: data.date_of_manufacture || '',
        expiration: data.expiration || '',
        lot: data.lot || '',
        ref: data.ref || '',
        quantity: data.quantity || '',
        labels: '',
        recycling_symbol: '',
        manufacture_address: data.manufacture_address || '',
        manufacture_site: data.manufacture_site || '',
        sponsor: data.sponsor || '',
        notes: data.notes || ''
      }

      // If there's return data from review page, use it
      if (returnData) {
        try {
          const parsedData = JSON.parse(decodeURIComponent(returnData))
          initialFormData = { ...initialFormData, ...parsedData.formData }
        } catch (e) {
          console.error('Failed to parse return data:', e)
        }
      }

      setFormData(initialFormData)

      // Record what the extraction produced, if one has been run for this item.
      if (data.extracted_at) {
        setExtractionBaseline(
          Object.fromEntries(REVIEW_FIELDS.map(f => [f.name, data[f.name] ?? null]))
        )
        setExtractionMeta({
          model: data.extraction_model,
          prompt_version: data.extraction_prompt_version,
          extracted_at: data.extracted_at
        })
      }

    } catch (error) {
      console.error('Error:', error)
      setError('An error occurred while loading the item')
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (index) => {
    setSelectedImageIndex(index)
  }

  /** Read the packaging again and replace the form values with the result. */
  const handleRerunExtraction = async () => {
    setRerunning(true)
    setRerunError(null)

    try {
      const response = await fetch('/api/photo-submissions/ai-image-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission_id: itemId })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Extraction failed')

      setFormData(prev => ({ ...prev, ...data.columns }))
      setExtractionBaseline(data.columns)
      setExtractionMeta(data.extraction_meta)
    } catch (err) {
      setRerunError(err.message)
    } finally {
      setRerunning(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Walkthrough only: overlay the invented values when the toggle is on, so the
  // form shows what a reader that never returns null would have produced.
  const guessOverlay = showGuesses
    ? Object.fromEntries(Object.entries(guesses).map(([key, guess]) => [key, guess.value]))
    : null
  const shownFormData = guessOverlay ? { ...formData, ...guessOverlay } : formData
  const shownBaseline = extractionBaseline && guessOverlay
    ? { ...extractionBaseline, ...guessOverlay }
    : extractionBaseline
  const guessedFields = Object.keys(guesses)
    .map(name => REVIEW_FIELDS.find(f => f.name === name))
    .filter(Boolean)

  const handleReview = () => {
    // Navigate to review page with form data
    const reviewData = encodeURIComponent(JSON.stringify({
      itemId: itemId,
      formData: formData,
      images: getImageList()
    }))
    router.push(`/items/${itemId}/review?data=${reviewData}`)
  }

  const handleImageClick = (imageUrl) => {
    setModalImageUrl(imageUrl)
    setShowImageModal(true)
  }

  const handleCloseModal = () => {
    setShowImageModal(false)
    setModalImageUrl('')
  }

  const getImageList = () => {
    if (!item) return []
    // Use only the image URL list from the detail table
    return imagesFromDetail
  }

  const handleFilesUpload = async (files) => {
    if (!files?.length) return
    try {
      setUploading(true)
      const uploaded = []
      for (const file of files) {
        const ext = file.name.split('.').pop()
        const path = `photo/uploads/${new Date().getFullYear()}/${String(new Date().getMonth()+1).padStart(2,'0')}/${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage.from('mp-images').upload(path, file)
        if (upErr) throw upErr
        uploaded.push({ path, size: file.size, mime: file.type })
      }
      // Register to detail table
      await fetch(`/api/photo-submissions/${itemId}/images/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: uploaded })
      })
      // Refresh
      await fetchItem()
    } catch (e) {
      console.error(e)
      alert('Upload failed, please try again')
    } finally {
      setUploading(false)
    }
  }

  const toggleSelect = (imageId) => {
    setSelectedImageIds(prev => {
      const next = new Set(prev)
      if (next.has(imageId)) next.delete(imageId)
      else next.add(imageId)
      return next
    })
  }

  const selectAll = () => {
    setSelectedImageIds(new Set(imageRecords.map(r => r.id)))
  }

  const clearSelection = () => setSelectedImageIds(new Set())

  const handleDeleteSelected = async () => {
    if (selectedImageIds.size === 0) return alert('Please select images to delete.')
    if (!confirm(`Delete ${selectedImageIds.size} selected images? (soft delete)`)) return
    try {
      const ids = Array.from(selectedImageIds)
      const res = await fetch('/api/photo-submissions/images/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageIds: ids, hardDelete: false })
      })
      if (!res.ok) throw new Error(await res.text())
      clearSelection()
      await fetchItem()
    } catch (e) {
      console.error(e)
      alert('Delete failed, please try again.')
    }
  }

  const [showMoveModal, setShowMoveModal] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemManufacturer, setNewItemManufacturer] = useState('')
  const [showMoveExisting, setShowMoveExisting] = useState(false)
  const [existingSubmissions, setExistingSubmissions] = useState([])
  const [selectedTargetId, setSelectedTargetId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [zoomLevel, setZoomLevel] = useState(100) // Image zoom level in percentage

  const handleMoveToNew = () => {
    if (selectedImageIds.size === 0) return alert('Please select images to move.')
    setShowMoveModal(true)
  }

  const handleMoveToExisting = async () => {
    if (selectedImageIds.size === 0) return alert('Please select images to move.')
    
    // Load existing submissions
    try {
      const { data, error } = await supabase
        .from('photo_submissions')
        .select('id, name, manufacturer, status')
        .neq('id', itemId) // Exclude current submission
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      setExistingSubmissions(data || [])
      setShowMoveExisting(true)
    } catch (e) {
      console.error('Failed to load submissions:', e)
      alert('Failed to load existing submissions')
    }
  }

  const submitMoveToNew = async () => {
    if (!newItemName.trim() || !newItemManufacturer.trim()) return alert('Please fill in Name and Manufacturer.')
    try {
      const ids = Array.from(selectedImageIds)
      const res = await fetch('/api/photo-submissions/reassign/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceSubmissionId: Number(itemId), imageIds: ids, newSubmission: { name: newItemName.trim(), manufacturer: newItemManufacturer.trim() } })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'move failed')
      clearSelection()
      setShowMoveModal(false)
      setNewItemName('')
      setNewItemManufacturer('')
      // Auto redirect to new submission
      window.location.href = `/items/${json.newSubmissionId}`
    } catch (e) {
      console.error(e)
      alert('Move failed, please try again.')
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        fontSize: '18px'
      }}>
        Loading item details...
      </div>
    )
  }

  if (error || !item) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ color: '#e74c3c', fontSize: '18px' }}>{error || 'Item not found'}</div>
        <button
          onClick={() => router.push('/items')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6c5ce7',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Back to Items
        </button>
      </div>
    )
  }

  const images = getImageList()
  const selectedImage = images[selectedImageIndex]

  // Calculate grid columns based on zoom level
  const getGridColumns = () => {
    if (zoomLevel <= 50) return 'repeat(6, 1fr)'
    if (zoomLevel <= 75) return 'repeat(5, 1fr)'
    if (zoomLevel <= 100) return 'repeat(4, 1fr)'
    if (zoomLevel <= 125) return 'repeat(3, 1fr)'
    return 'repeat(2, 1fr)'
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 25))
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '0 24px 40px 24px'
    }}>
      <div style={{
        marginBottom: '16px'
      }}>
        <Link
          href="/items"
          style={{
            fontSize: '14px',
            color: '#6c5ce7',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: '#eef2ff',
            borderRadius: '999px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e0e7ff'
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#eef2ff'
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          <span style={{
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
          }}>
            ←
          </span>
          <span style={{ fontWeight: '600', color: '#4f46e5' }}>Back to Review Queue</span>
        </Link>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '3fr 2fr',
        gap: '24px',
        alignItems: 'flex-start'
      }}>
          {/* Left Side - Images Grid */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 200px)',
            overflow: 'hidden'
          }}>
            {/* Zoom Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <button
                  onClick={handleZoomOut}
                  style={{
                    width: '32px',
                    height: '32px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: '#333'
                  }}
                >
                  −
                </button>
                <span style={{
                  fontSize: '14px',
                  color: '#666',
                  minWidth: '50px',
                  textAlign: 'center'
                }}>
                  {zoomLevel}%
                </span>
                <button
                  onClick={handleZoomIn}
                  style={{
                    width: '32px',
                    height: '32px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    color: '#333'
                  }}
                >
                  +
                </button>
              </div>
              
              {/* Batch Operation Buttons */}
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <label style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  borderRadius: '6px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.7 : 1,
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {uploading ? 'Uploading...' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFilesUpload(Array.from(e.target.files || []))}
                    style={{ display: 'none' }}
                    disabled={uploading}
                  />
                </label>
                <button 
                  onClick={selectAll} 
                  style={{ 
                    padding: '6px 12px', 
                    border: '1px solid #ddd', 
                    borderRadius: '6px', 
                    background: '#fff', 
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Select All
                </button>
                <button 
                  onClick={clearSelection} 
                  style={{ 
                    padding: '6px 12px', 
                    border: '1px solid #ddd', 
                    borderRadius: '6px', 
                    background: '#fff', 
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Clear
                </button>
                <button 
                  onClick={handleDeleteSelected} 
                  style={{ 
                    padding: '6px 12px', 
                    border: '1px solid #e74c3c', 
                    color: '#e74c3c', 
                    borderRadius: '6px', 
                    background: '#fff', 
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Delete
                </button>
                <button 
                  onClick={handleMoveToNew} 
                  style={{ 
                    padding: '6px 12px', 
                    border: '1px solid #1a1a1a', 
                    color: '#1a1a1a', 
                    borderRadius: '6px', 
                    background: '#fff', 
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Move to New
                </button>
                <button 
                  onClick={handleMoveToExisting} 
                  style={{ 
                    padding: '6px 12px', 
                    border: '1px solid #1a1a1a', 
                    color: '#1a1a1a', 
                    borderRadius: '6px', 
                    background: '#fff', 
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Move to Existing
                </button>
              </div>
            </div>
            
            {/* Image Grid with Scroll */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarWidth: 'thin',
              scrollbarColor: '#1a1a1a #f0f0f0'
            }}>
              {imageRecords.length > 0 ? (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: getGridColumns(),
                  gap: '12px'
                }}>
                  {imageRecords.map((rec, index) => (
                    <div
                      key={rec.id}
                      onClick={() => handleImageClick(rec.url)}
                      style={{
                        aspectRatio: '1',
                        border: selectedImageIndex === index ? '2px solid #1a1a1a' : '1px solid #e9ecef',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        backgroundColor: '#f8f9fa',
                        position: 'relative',
                        transition: 'border-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#1a1a1a'
                      }}
                      onMouseLeave={(e) => {
                        if (selectedImageIndex !== index) {
                          e.currentTarget.style.borderColor = '#e9ecef'
                        }
                      }}
                    >
                      <img
                        src={rec.url}
                        alt={`Image ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transform: `scale(${zoomLevel / 100})`,
                          transformOrigin: 'center'
                        }}
                      />
                      <input
                        type="checkbox"
                        checked={selectedImageIds.has(rec.id)}
                        onChange={(e) => { e.stopPropagation(); toggleSelect(rec.id) }}
                        style={{ 
                          position: 'absolute', 
                          top: 8, 
                          left: 8,
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer',
                          zIndex: 10
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '200px',
                  color: '#999',
                  fontSize: '14px'
                }}>
                  No images available
                </div>
              )}
            </div>
          </div>

        {/* Right Side - Form */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 200px)',
          overflow: 'hidden'
        }}>
          {/* Form Header */}
          <div style={{
            marginBottom: '20px',
            borderBottom: '1px solid #e9ecef',
            paddingBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#1a1a1a',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              Product Details
              <span style={{ fontSize: '12px', fontWeight: '500', color: '#dc2626' }}>(Required fields are marked with *)</span>
            </h3>
          </div>

          {/* Scrollable Form Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: '#1a1a1a #f0f0f0',
            paddingRight: '8px'
          }}>
            {isDemo && (
              <div style={{
                border: '1px solid #e9ecef',
                borderLeft: '3px solid #98a2b3',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '16px',
                fontSize: '12.5px',
                color: '#667085',
                lineHeight: 1.6
              }}>
                <strong style={{ color: '#344054', fontWeight: '600' }}>Walkthrough.</strong>{' '}
                A real item and real photographs, from the MediScan evaluation set. This is the
                review screen itself, showing what the extraction rules produce for that item —
                no model was called and no record was loaded.
              </div>
            )}

            <ExtractionProvenance
              meta={extractionMeta}
              fields={REVIEW_FIELDS.map(f => f.name)}
              extraction={extractionBaseline}
              onRerun={handleRerunExtraction}
              rerunning={rerunning}
              rerunError={rerunError}
            />

            {isDemo && guessedFields.length > 0 && (
              <div style={{
                border: '1px solid #e9ecef',
                borderLeft: '3px solid #dc2626',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#101828',
                  cursor: 'pointer'
                }}>
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
                    ? `The form now looks complete. ${guessedFields.map(f => f.label).join(' and ')} is nowhere on this label — and a reviewer reading the finished form has no way to tell it apart from what was really there.`
                    : `${guessedFields.length === 1 ? 'One field' : `${guessedFields.length} fields`} came back empty because this label does not carry ${guessedFields.length === 1 ? 'it' : 'them'}. That is the designed behaviour, not a failure.`}
                </p>
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '16px',
              marginBottom: '16px'
            }}>
              {REVIEW_FIELDS.map((field) => (
                <ExtractionField
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  required={field.required}
                  multiline={field.multiline}
                  value={shownFormData[field.name] ?? ''}
                  extracted={shownBaseline ? shownBaseline[field.name] : undefined}
                  onChange={handleInputChange}
                />
              ))}
            </div>
      </div>

      {/* Review Actions */}
      <div style={{
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid #e9ecef',
        display: 'flex',
        gap: '12px'
      }}>
        <button
          onClick={handleReview}
          style={{
            flex: 1,
            padding: '12px 24px',
            backgroundColor: '#1a1a1a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#333333'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#1a1a1a'
          }}
        >
          <span>✓</span>
          Mark as complete
        </button>

        <button
          onClick={() => setShowRejectConfirm(true)}
          style={{
            flex: 1,
            padding: '12px 24px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#dc2626'
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#ef4444'
          }}
        >
          <span>✕</span>
          Reject
        </button>
      </div>
        </div>
      </div>

      {/* Image Modal */}
      {showImageModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          {/* Close Button */}
          <button
            onClick={handleCloseModal}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease',
              zIndex: 10000
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
            }}
          >
            ×
          </button>

          {/* Image */}
          <img
            src={modalImageUrl}
            alt="Enlarged view"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}
            onClick={handleCloseModal}
          />
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '360px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              marginBottom: '16px',
              color: '#1a1a1a'
            }}>
              Reject Item
            </h3>
            <p style={{
              fontSize: '16px',
              color: '#666',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Are you sure you want to reject this item? It will be removed from the queue.
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowRejectConfirm(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f8f9fa',
                  color: '#666',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: rejecting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                disabled={rejecting}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                try {
                  setRejecting(true)
                  const submissionId = Number(itemId)
                  const idFilter = Number.isNaN(submissionId) ? itemId : submissionId

                  const res = await fetch('/api/photo-submissions/reject', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ submissionId: idFilter })
                  })

                  if (!res.ok) {
                    const json = await res.json().catch(() => ({}))
                    console.error('Reject failed:', json?.error || 'Unknown error')
                    alert('Failed to reject item')
                    return
                  }

                  const { data: nextItems, error: nextError } = await supabase
                    .from('photo_submissions')
                    .select('id')
                    .neq('id', idFilter)
                    .eq('status', 'in_review')
                    .order('created_at', { ascending: true })
                    .limit(1)

                  const query = new URLSearchParams()
                  query.set('from', itemId)
                  query.set('status', 'rejected')
                  if (!nextError && nextItems && nextItems.length > 0) {
                    query.set('nextId', nextItems[0].id)
                  }

                  router.push(`/items/review/success?${query.toString()}`)
                } catch (rejectError) {
                  console.error('Reject error:', rejectError)
                  alert('Failed to reject item')
                } finally {
                  setRejecting(false)
                  setShowRejectConfirm(false)
                }
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: rejecting ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                disabled={rejecting}
              >
                {rejecting ? 'Processing...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move to Existing Submission Modal */}
      {showMoveExisting && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '600px', maxHeight: '80vh', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Move to Existing Submission</h3>
            
            {/* Search */}
            <div style={{ marginBottom: '16px' }}>
              <input 
                type="text" 
                placeholder="Search by name or manufacturer..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: 6 }}
              />
            </div>
            
            {/* Submission List */}
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #eee', borderRadius: 6 }}>
              {existingSubmissions
                .filter(sub => 
                  !searchTerm || 
                  sub.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  sub.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(sub => (
                <div 
                  key={sub.id}
                  onClick={() => setSelectedTargetId(sub.id)}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    backgroundColor: selectedTargetId === sub.id ? '#f0f8ff' : 'transparent',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>{sub.name}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>{sub.manufacturer}</div>
                    <div style={{ fontSize: '12px', color: '#999' }}>ID: {sub.id} | Status: {sub.status}</div>
                  </div>
                  {selectedTargetId === sub.id && (
                    <div style={{ color: '#6c5ce7', fontSize: '18px' }}>✓</div>
                  )}
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={()=>{setShowMoveExisting(false); setSelectedTargetId(''); setSearchTerm('')}} style={{ padding: '8px 12px', border: '1px solid #ddd', background: '#f8f9fa', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button onClick={async () => {
                if (selectedImageIds.size === 0) { alert('Please select images to move.'); return }
                if (!selectedTargetId) { alert('Please select a target submission.'); return }
                try {
                  const ids = Array.from(selectedImageIds)
                  const res = await fetch('/api/photo-submissions/reassign/existing', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ targetSubmissionId: Number(selectedTargetId), imageIds: ids })
                  })
                  const json = await res.json()
                  if (!res.ok) throw new Error(json?.error || 'move failed')
                  clearSelection(); setShowMoveExisting(false); setSelectedTargetId(''); setSearchTerm(''); await fetchItem()
                  alert('Images moved successfully!')
                } catch (e) { console.error(e); alert('Move failed, please try again.') }
              }} style={{ padding: '8px 12px', background: '#6c5ce7', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Move</button>
            </div>
          </div>
        </div>
      )}
      {/* Move to New Submission Modal */}
      {showMoveModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '420px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Create New Submission</h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, color: '#333', marginBottom: 6 }}>Name</label>
                <input value={newItemName} onChange={(e)=>setNewItemName(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 14, color: '#333', marginBottom: 6 }}>Manufacturer</label>
                <input value={newItemManufacturer} onChange={(e)=>setNewItemManufacturer(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 6 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={()=>setShowMoveModal(false)} style={{ padding: '8px 12px', border: '1px solid #ddd', background: '#f8f9fa', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button onClick={submitMoveToNew} style={{ padding: '8px 12px', background: '#6c5ce7', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Create & Move</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
