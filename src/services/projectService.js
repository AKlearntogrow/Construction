/**
 * Project Service - Industry Standard Schema
 * Handles all project-related database operations
 */

import { supabase } from '../lib/supabase'

// ============================================================================
// PROJECTS
// ============================================================================

/**
 * Get all projects
 */
export async function getAllProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      owner_company:owner_company_id(id, name),
      gc_company:gc_company_id(id, name)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get active projects only
 */
export async function getActiveProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .in('status', ['planning', 'pre_construction', 'active', 'punch_list'])
    .order('name')

  if (error) throw error
  return data
}

/**
 * Get project by ID with full details
 */
export async function getProjectById(id) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      owner_company:owner_company_id(id, name),
      gc_company:gc_company_id(id, name),
      architect_company:architect_company_id(id, name)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Create a new project
 */
export async function createProject(projectData) {
  // Generate project code if not provided
  if (!projectData.project_code) {
    projectData.project_code = await generateProjectCode()
  }

  // Get current user's company if not provided
  if (!projectData.gc_company_id) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('company_id')
        .eq('auth_id', user.id)
        .single()
      
      if (profile?.company_id) {
        projectData.gc_company_id = profile.company_id
      }
    }
  }

  const { data, error } = await supabase
    .from('projects')
    .insert([projectData])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a project
 */
export async function updateProject(id, updates) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a project (soft delete by setting status)
 */
export async function deleteProject(id) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

async function generateProjectCode() {
  const year = new Date().getFullYear().toString().slice(-2)
  // Use timestamp + random for guaranteed uniqueness
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 4).toUpperCase()
  return `PRJ-${year}-${timestamp}${random}`
}

/**
 * Get project statistics
 */
export async function getProjectStats(projectId) {
  // Get ticket totals
  const { data: tickets } = await supabase
    .from('tickets')
    .select('total_amount, status')
    .eq('project_id', projectId)

  // Get change order totals
  const { data: changeOrders } = await supabase
    .from('change_orders')
    .select('current_amount, status')
    .eq('project_id', projectId)

  // Get RFI count
  const { count: rfiCount } = await supabase
    .from('rfis')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  const ticketTotal = tickets?.reduce((sum, t) => sum + parseFloat(t.total_amount || 0), 0) || 0
  const coTotal = changeOrders?.reduce((sum, co) => sum + parseFloat(co.current_amount || 0), 0) || 0
  const approvedCOs = changeOrders?.filter(co => co.status === 'approved').length || 0
  const pendingCOs = changeOrders?.filter(co => co.status === 'submitted' || co.status === 'under_review').length || 0

  return {
    ticketCount: tickets?.length || 0,
    ticketTotal,
    changeOrderCount: changeOrders?.length || 0,
    changeOrderTotal: coTotal,
    approvedCOs,
    pendingCOs,
    rfiCount: rfiCount || 0
  }
}

// ============================================================================
// PROJECT TYPES & STATUS OPTIONS (for dropdowns)
// ============================================================================

export const PROJECT_TYPES = [
  { value: 'commercial', label: 'Commercial' },
  { value: 'residential', label: 'Residential' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'retail', label: 'Retail' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'mixed_use', label: 'Mixed Use' },
  { value: 'renovation', label: 'Renovation' },
]

export const PROJECT_STATUSES = [
  { value: 'planning', label: 'Planning', color: 'slate' },
  { value: 'bidding', label: 'Bidding', color: 'purple' },
  { value: 'pre_construction', label: 'Pre-Construction', color: 'blue' },
  { value: 'active', label: 'Active', color: 'emerald' },
  { value: 'on_hold', label: 'On Hold', color: 'amber' },
  { value: 'punch_list', label: 'Punch List', color: 'orange' },
  { value: 'closeout', label: 'Closeout', color: 'cyan' },
  { value: 'complete', label: 'Complete', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
]

export function getProjectStatusColor(status) {
  const found = PROJECT_STATUSES.find(s => s.value === status)
  return found?.color || 'slate'
}

export function getProjectStatusLabel(status) {
  const found = PROJECT_STATUSES.find(s => s.value === status)
  return found?.label || status
}



// ============================================================================
// JOIN PROJECT (for subcontractors)
// ============================================================================

/**
 * Join a project by project code
 * @param {string} projectCode - The project code to join (e.g., PRJ-26-ABC123)
 * @returns {object} - The project team membership
 */
export async function joinProjectByCode(projectCode) {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get user profile with company
  const { data: profile } = await supabase
    .from('users')
    .select('id, company_id')
    .eq('auth_id', user.id)
    .single()
  
  if (!profile) throw new Error('User profile not found')

  // Find project by code using RPC function (bypasses RLS)
  const { data: projects, error: projectError } = await supabase
    .rpc('lookup_project_by_code', { p_code: projectCode })

  if (projectError || !projects || projects.length === 0) {
    throw new Error('Project not found. Please check the code and try again.')
  }

  const project = projects[0]

  // Check if already a member
  const { data: existing } = await supabase
    .from('project_team')
    .select('id')
    .eq('project_id', project.id)
    .eq('user_id', profile.id)
    .maybeSingle()

  if (existing) {
    throw new Error('You are already a member of this project.')
  }

  // Add user to project team
  const { data: membership, error: memberError } = await supabase
    .from('project_team')
    .insert({
      project_id: project.id,
      user_id: profile.id,
      company_id: profile.company_id,
      project_role: 'subcontractor',
      status: 'active'
    })
    .select()
    .single()

  if (memberError) throw memberError

  return { membership, project }
}

/**
 * Get projects the user is a member of (as subcontractor)
 */
export async function getJoinedProjects() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .single()

  if (!profile) return []

  const { data, error } = await supabase
    .from('project_team')
    .select(`
      id,
      project_role,
      status,
      project:project_id(
        id,
        project_code,
        name,
        status,
        gc_company:gc_company_id(name)
      )
    `)
    .eq('user_id', profile.id)

  if (error) throw error
  return data || []
}


