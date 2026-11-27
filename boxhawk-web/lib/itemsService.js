'use client'

import { supabase } from '@/lib/supabaseClient'

const defaultLimit = 12

const fetchItemImages = async (item) => {
  const { data: images } = await supabase
    .from('photo_submission_images')
    .select('storage_path')
    .eq('submission_id', item.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })

  const imageUrls = (images || []).map(img =>
    supabase.storage.from('mp-images').getPublicUrl(img.storage_path).data.publicUrl
  )

  return {
    ...item,
    images: imageUrls
  }
}

export async function fetchItemsWithImages({
  includeStatuses,
  excludeStatuses,
  createdBy,
  limit = defaultLimit,
  offset,
  searchTerm
} = {}) {
  let query = supabase
    .from('photo_submissions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (includeStatuses && includeStatuses.length > 0) {
    query = query.in('status', includeStatuses)
  }

  if (excludeStatuses && excludeStatuses.length > 0) {
    excludeStatuses.forEach((status) => {
      query = query.neq('status', status)
    })
  }

  if (createdBy) {
    query = query.eq('created_by', createdBy)
  }

  if (searchTerm && searchTerm.trim()) {
    query = query.or(`name.ilike.%${searchTerm}%,manufacturer.ilike.%${searchTerm}%`)
  }

  if (typeof offset === 'number') {
    query = query.range(offset, offset + limit - 1)
  } else if (typeof limit === 'number') {
    query = query.limit(limit)
  }

  const { data, error, count } = await query

  if (error) {
    return { error, items: [], count: 0 }
  }

  const itemsWithImages = await Promise.all((data || []).map(fetchItemImages))

  return {
    items: itemsWithImages,
    count: count || itemsWithImages.length,
    error: null
  }
}

