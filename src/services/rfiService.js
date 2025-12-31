/**
 * RFI Service - Industry Standard Schema
 * Handles Requests for Information
 */

import { supabase } from '../lib/supabase'

/**
 * Get all RFIs for a project
 */
export async function getRFIsByProject(projectId) {
  const { data, error } = await supabase
    .from('rfis')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get RFI by ID
 */
export async function getRFIById(id) {
  const { data, error } = await supabase
    .from('rfis')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Create a new RFI
 */
export async function createRFI(rfiData) {
  const { data, error } = await supabase
    .from('rfis')
    .insert([{
      project_id: rfiData.project_id,
      title: rfiData.title,
      question: rfiData.question,
      suggestion: rfiData.suggestion,
      location: rfiData.location,
      priority: rfiData.priority || 'normal',
      status: 'draft'
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Respond to RFI
 */

/**
 * Update an RFI
 */
export async function updateRFI(id, updates) {
  const { data, error } = await supabase
    .from('rfis')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function respondToRFI(id, response) {
  const { data, error } = await supabase
    .from('rfis')
    .update({
      response,
      responded_at: new Date().toISOString(),
      status: 'responded'
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const RFI_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'slate' },
  { value: 'submitted', label: 'Submitted', color: 'blue' },
  { value: 'under_review', label: 'Under Review', color: 'purple' },
  { value: 'responded', label: 'Responded', color: 'amber' },
  { value: 'closed', label: 'Closed', color: 'emerald' },
]

export const RFI_PRIORITIES = [
  { value: 'low', label: 'Low', color: 'slate' },
  { value: 'normal', label: 'Normal', color: 'blue' },
  { value: 'high', label: 'High', color: 'amber' },
  { value: 'urgent', label: 'Urgent', color: 'red' },
]

