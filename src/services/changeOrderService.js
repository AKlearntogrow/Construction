/**
 * Change Order Service - Industry Standard Schema
 * Handles Change Order and PCO operations
 */

import { supabase } from '../lib/supabase'

// ============================================================================
// CHANGE ORDERS (CO)
// ============================================================================

/**
 * Get all change orders
 */
export async function getAllChangeOrders() {
  const { data, error } = await supabase
    .from('change_orders')
    .select(`
      *,
      project:project_id(id, project_code, name)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get change orders for a specific project
 */
export async function getChangeOrdersByProject(projectId) {
  const { data, error } = await supabase
    .from('change_orders')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get change order by ID with tickets
 */
export async function getChangeOrderById(id) {
  const { data: co, error: coError } = await supabase
    .from('change_orders')
    .select(`
      *,
      project:project_id(id, project_code, name)
    `)
    .eq('id', id)
    .single()

  if (coError) throw coError

  // Get linked tickets
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('*')
    .eq('change_order_id', id)
    .order('created_at', { ascending: false })

  if (ticketsError) throw ticketsError

  return { ...co, tickets: tickets || [] }
}

/**
 * Create a new change order
 */
export async function createChangeOrder(coData) {
  const { data, error } = await supabase
    .from('change_orders')
    .insert([{
      project_id: coData.project_id,
      title: coData.title,
      description: coData.description || coData.notes,
      notes: coData.notes,
      status: 'draft'
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a change order
 */
export async function updateChangeOrder(id, updates) {
  const { data, error } = await supabase
    .from('change_orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a change order
 */
export async function deleteChangeOrder(id) {
  // First unlink any tickets
  await supabase
    .from('tickets')
    .update({ change_order_id: null })
    .eq('change_order_id', id)

  const { error } = await supabase
    .from('change_orders')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

/**
 * Submit change order for approval
 */
export async function submitChangeOrder(id) {
  // Get current total from tickets
  const { data: tickets } = await supabase
    .from('tickets')
    .select('total_amount')
    .eq('change_order_id', id)

  const currentAmount = tickets?.reduce((sum, t) => sum + parseFloat(t.total_amount || 0), 0) || 0

  const { data, error } = await supabase
    .from('change_orders')
    .update({
      status: 'submitted',
      original_amount: currentAmount,
      current_amount: currentAmount,
      submitted_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Approve a change order
 */
export async function approveChangeOrder(id, approverName) {
  const { data, error } = await supabase
    .from('change_orders')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Reject a change order
 */
export async function rejectChangeOrder(id, rejectorName, reason = null) {
  const { data, error } = await supabase
    .from('change_orders')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejection_reason: reason
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Add tickets to a change order
 */
export async function addTicketsToChangeOrder(changeOrderId, ticketIds) {
  const { error } = await supabase
    .from('tickets')
    .update({ change_order_id: changeOrderId })
    .in('id', ticketIds)

  if (error) throw error

  // Return updated CO with tickets
  return getChangeOrderById(changeOrderId)
}

/**
 * Remove ticket from change order
 */
export async function removeTicketFromChangeOrder(ticketId, changeOrderId) {
  const { error } = await supabase
    .from('tickets')
    .update({ change_order_id: null })
    .eq('id', ticketId)

  if (error) throw error

  // Update CO current amount
  await recalculateCOAmount(changeOrderId)

  return getChangeOrderById(changeOrderId)
}

/**
 * Recalculate change order amount from tickets
 */
async function recalculateCOAmount(changeOrderId) {
  const { data: tickets } = await supabase
    .from('tickets')
    .select('total_amount')
    .eq('change_order_id', changeOrderId)

  const currentAmount = tickets?.reduce((sum, t) => sum + parseFloat(t.total_amount || 0), 0) || 0

  await supabase
    .from('change_orders')
    .update({ current_amount: currentAmount })
    .eq('id', changeOrderId)
}

/**
 * Get unassigned tickets for a project
 */
export async function getUnassignedTickets(projectId = null) {
  let query = supabase
    .from('tickets')
    .select(`
      *,
      project:project_id(id, project_code, name)
    `)
    .is('change_order_id', null)
    .order('created_at', { ascending: false })

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

/**
 * Get change order statistics
 */
export async function getChangeOrderStats(projectId = null) {
  let query = supabase.from('change_orders').select('*')
  
  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  const { data, error } = await query

  if (error) throw error

  const stats = {
    total: data?.length || 0,
    draft: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    totalOriginal: 0,
    totalCurrent: 0,
    totalVariance: 0,
    variancePercent: 0
  }

  data?.forEach(co => {
    stats[co.status] = (stats[co.status] || 0) + 1
    stats.totalOriginal += parseFloat(co.original_amount || 0)
    stats.totalCurrent += parseFloat(co.current_amount || 0)
  })

  stats.totalVariance = stats.totalCurrent - stats.totalOriginal
  stats.variancePercent = stats.totalOriginal > 0 
    ? ((stats.totalVariance / stats.totalOriginal) * 100).toFixed(1)
    : 0

  return stats
}

/**
 * Calculate variance for a change order
 */
export function calculateVariance(changeOrder) {
  const original = parseFloat(changeOrder.original_amount || 0)
  const current = parseFloat(changeOrder.current_amount || 0)
  const variance = current - original
  const percent = original > 0 ? ((variance / original) * 100).toFixed(1) : 0

  return {
    original,
    current,
    amount: variance,
    percent,
    isOverBudget: variance > 0
  }
}

// ============================================================================
// STATUS OPTIONS
// ============================================================================

export const CO_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'slate' },
  { value: 'pending_submission', label: 'Pending Submission', color: 'amber' },
  { value: 'submitted', label: 'Submitted', color: 'blue' },
  { value: 'under_review', label: 'Under Review', color: 'purple' },
  { value: 'approved', label: 'Approved', color: 'emerald' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'void', label: 'Void', color: 'gray' },
  { value: 'executed', label: 'Executed', color: 'green' },
]

export const CHANGE_REASONS = [
  { value: 'owner_request', label: 'Owner Request' },
  { value: 'design_change', label: 'Design Change' },
  { value: 'field_condition', label: 'Field Condition' },
  { value: 'code_requirement', label: 'Code Requirement' },
  { value: 'value_engineering', label: 'Value Engineering' },
  { value: 'rfi_response', label: 'RFI Response' },
  { value: 'error_omission', label: 'Error/Omission' },
  { value: 'weather', label: 'Weather' },
  { value: 'other', label: 'Other' },
]

export function getCOStatusColor(status) {
  const found = CO_STATUSES.find(s => s.value === status)
  return found?.color || 'slate'
}

export function getCOStatusLabel(status) {
  const found = CO_STATUSES.find(s => s.value === status)
  return found?.label || status
}
