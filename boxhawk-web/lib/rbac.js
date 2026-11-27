import { supabase } from './supabaseClient'

// Role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY = {
  'photouser': 1,
  'expert': 2,
  'admin': 3,
  'superadmin': 4
}

// Page permissions mapping
const PAGE_PERMISSIONS = {
  '/': ['photouser', 'expert', 'admin', 'superadmin'], // Home page - all roles
  '/success': ['photouser', 'expert', 'admin', 'superadmin'], // Success page - all roles
  '/photo/upload': ['photouser', 'admin', 'superadmin'], // Upload page - PhotoUser and Admin
  '/photo/history': ['photouser', 'admin', 'superadmin'], // Uploader's own submission history
  '/items': ['expert', 'admin', 'superadmin'], // Items list - Expert and above
  '/items/[id]': ['expert', 'admin', 'superadmin'], // Item detail - Expert and above
  '/items/[id]/review': ['expert', 'admin', 'superadmin'], // Review page - Expert and above
  '/admin/users': ['admin', 'superadmin'] // User management - Admin and above
}

/**
 * Get current user's role
 * @returns {Promise<string|null>} User role or null if not authenticated
 */
export async function getCurrentUserRole() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      return null
    }
    
    return session.user.app_metadata?.role || 'photouser'
  } catch (error) {
    console.error('Error getting user role:', error)
    return null
  }
}

/**
 * Check if user has required role for a page
 * @param {string} pagePath - The page path to check
 * @param {string} userRole - The user's current role
 * @returns {boolean} Whether user has access
 */
export function hasPageAccess(pagePath, userRole) {
  // Handle dynamic routes
  const normalizedPath = normalizePath(pagePath)
  const allowedRoles = PAGE_PERMISSIONS[normalizedPath]
  
  if (!allowedRoles) {
    console.warn(`No permissions defined for path: ${pagePath}`)
    return false
  }
  
  return allowedRoles.includes(userRole)
}

/**
 * Check if user has minimum role level
 * @param {string} userRole - The user's current role
 * @param {string} requiredRole - The minimum required role
 * @returns {boolean} Whether user meets minimum role requirement
 */
export function hasMinimumRole(userRole, requiredRole) {
  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0
  
  return userLevel >= requiredLevel
}

/**
 * Normalize dynamic routes to their base paths
 * @param {string} path - The path to normalize
 * @returns {string} Normalized path
 */
function normalizePath(path) {
  // Handle dynamic routes
  if (path.startsWith('/items/') && path.includes('/review')) {
    return '/items/[id]/review'
  }
  if (path.startsWith('/items/')) {
    return '/items/[id]'
  }
  
  return path
}

/**
 * Get user's accessible pages based on their role
 * @param {string} userRole - The user's role
 * @returns {string[]} Array of accessible page paths
 */
export function getAccessiblePages(userRole) {
  const accessiblePages = []
  
  for (const [pagePath, allowedRoles] of Object.entries(PAGE_PERMISSIONS)) {
    if (allowedRoles.includes(userRole)) {
      accessiblePages.push(pagePath)
    }
  }
  
  return accessiblePages
}

/**
 * Redirect user to appropriate page based on their role
 * @param {string} userRole - The user's role
 * @returns {string} The appropriate redirect path
 */
export function getDefaultRedirect(userRole) {
  switch (userRole) {
    case 'photouser':
      return '/photo/upload'
    case 'expert':
    case 'admin':
    case 'superadmin':
      return '/items'
    default:
      return '/'
  }
}

/**
 * Check if user can access a specific action
 * @param {string} action - The action to check
 * @param {string} userRole - The user's role
 * @returns {boolean} Whether user can perform the action
 */
export function canPerformAction(action, userRole) {
  const actionPermissions = {
    'upload_photos': ['photouser'],
    'review_items': ['expert', 'admin', 'superadmin'],
    'manage_users': ['admin', 'superadmin'],
    'delete_users': ['admin', 'superadmin'],
    'create_superadmin': ['superadmin']
  }
  
  const allowedRoles = actionPermissions[action]
  return allowedRoles ? allowedRoles.includes(userRole) : false
}

