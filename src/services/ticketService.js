/**
 * Ticket Service - Industry Standard Schema
 * Handles T&M Ticket operations
 */

import { supabase } from '../lib/supabase'

// ============================================================================
// TICKETS (T&M)
// ============================================================================

/**
 * Get all tickets for a project
 */
export async function getTicketsByProject(projectId) {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      cost_code:cost_code_id(id, code, name),
      change_order:change_order_id(id, co_number, title),
      pco:potential_change_order_id(id, pco_number, title)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get all tickets (across all projects)
 */
export async function getAllTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      project:project_id(id, project_code, name),
      cost_code:cost_code_id(id, code, name),
      change_order:change_order_id(id, co_number, title)
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get ticket by ID
 */
export async function getTicketById(id) {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      project:project_id(id, project_code, name),
      cost_code:cost_code_id(id, code, name),
      change_order:change_order_id(id, co_number, title),
      pco:potential_change_order_id(id, pco_number, title)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Get unassigned tickets (not linked to any CO)
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
 * Create a new ticket
 */
export async function createTicket(ticketData) {
  // Calculate totals
  const laborTotal = calculateLaborTotal(ticketData.labor || [])
  const materialsTotal = calculateMaterialsTotal(ticketData.materials || [])
  const equipmentTotal = calculateEquipmentTotal(ticketData.equipment || [])
  
  const subtotal = laborTotal + materialsTotal + equipmentTotal
  const markupAmount = subtotal * (parseFloat(ticketData.markup_percent || 0) / 100)
  const totalAmount = subtotal + markupAmount

  const insertData = {
    project_id: ticketData.project_id,
    description: ticketData.description,
    location: ticketData.location,
    work_date: ticketData.work_date || new Date().toISOString().split('T')[0],
    cost_code_id: ticketData.cost_code_id,
    labor: ticketData.labor || [],
    labor_total: laborTotal,
    materials: ticketData.materials || [],
    materials_total: materialsTotal,
    equipment: ticketData.equipment || [],
    equipment_total: equipmentTotal,
    markup_percent: ticketData.markup_percent || 0,
    markup_amount: markupAmount,
    total_amount: totalAmount,
    original_transcript: ticketData.original_transcript,
    change_order_id: ticketData.change_order_id,
    potential_change_order_id: ticketData.potential_change_order_id,
    status: ticketData.status || 'draft'
  }

  const { data, error } = await supabase
    .from('tickets')
    .insert([insertData])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a ticket
 */
export async function updateTicket(id, updates) {
  // Recalculate totals if labor/materials/equipment changed
  if (updates.labor || updates.materials || updates.equipment) {
    const { data: existing } = await supabase
      .from('tickets')
      .select('labor, materials, equipment, markup_percent')
      .eq('id', id)
      .single()

    const labor = updates.labor || existing.labor || []
    const materials = updates.materials || existing.materials || []
    const equipment = updates.equipment || existing.equipment || []
    const markupPercent = updates.markup_percent ?? existing.markup_percent ?? 0

    const laborTotal = calculateLaborTotal(labor)
    const materialsTotal = calculateMaterialsTotal(materials)
    const equipmentTotal = calculateEquipmentTotal(equipment)
    const subtotal = laborTotal + materialsTotal + equipmentTotal
    const markupAmount = subtotal * (markupPercent / 100)

    updates.labor_total = laborTotal
    updates.materials_total = materialsTotal
    updates.equipment_total = equipmentTotal
    updates.markup_amount = markupAmount
    updates.total_amount = subtotal + markupAmount
  }

  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a ticket
 */
export async function deleteTicket(id) {
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

/**
 * Assign ticket to a change order
 */
export async function assignTicketToCO(ticketId, changeOrderId) {
  const { data, error } = await supabase
    .from('tickets')
    .update({ change_order_id: changeOrderId })
    .eq('id', ticketId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Remove ticket from change order
 */
export async function removeTicketFromCO(ticketId) {
  const { data, error } = await supabase
    .from('tickets')
    .update({ change_order_id: null })
    .eq('id', ticketId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

function calculateLaborTotal(laborEntries) {
  if (!Array.isArray(laborEntries)) return 0
  return laborEntries.reduce((sum, entry) => {
    const workers = parseFloat(entry.workers || entry.worker_count || 1)
    const hours = parseFloat(entry.hours || 0)
    const rate = parseFloat(entry.rate || 0)
    return sum + (workers * hours * rate)
  }, 0)
}

function calculateMaterialsTotal(materialEntries) {
  if (!Array.isArray(materialEntries)) return 0
  return materialEntries.reduce((sum, entry) => {
    const quantity = parseFloat(entry.quantity || entry.qty || 1)
    const unitCost = parseFloat(entry.unit_cost || entry.cost || 0)
    return sum + (quantity * unitCost)
  }, 0)
}

function calculateEquipmentTotal(equipmentEntries) {
  if (!Array.isArray(equipmentEntries)) return 0
  return equipmentEntries.reduce((sum, entry) => {
    const hours = parseFloat(entry.hours || 0)
    const rate = parseFloat(entry.rate || 0)
    return sum + (hours * rate)
  }, 0)
}

// ============================================================================
// STATUS OPTIONS
// ============================================================================

export const TICKET_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'slate' },
  { value: 'pending_review', label: 'Pending Review', color: 'amber' },
  { value: 'approved', label: 'Approved', color: 'emerald' },
  { value: 'rejected', label: 'Rejected', color: 'red' },
  { value: 'billed', label: 'Billed', color: 'blue' },
  { value: 'paid', label: 'Paid', color: 'green' },
]

export function getTicketStatusColor(status) {
  const found = TICKET_STATUSES.find(s => s.value === status)
  return found?.color || 'slate'
}

export function getTicketStatusLabel(status) {
  const found = TICKET_STATUSES.find(s => s.value === status)
  return found?.label || status
}

// ============================================================================
// DASHBOARD HELPERS
// ============================================================================

/**
 * Get recent tickets for dashboard
 */
export async function getRecentTickets(limit = 10) {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      project:project_id(id, project_code, name),
      change_order:change_order_id(id, co_number, title)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

/**
 * Get ticket statistics for dashboard
 */
export async function getTicketStats() {
  const { data, error } = await supabase
    .from('tickets')
    .select('status, total_amount, created_at')

  if (error) throw error

  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const stats = {
    total: data?.length || 0,
    draft: 0,
    pending_review: 0,
    approved: 0,
    rejected: 0,
    billed: 0,
    paid: 0,
    totalValue: 0,
    pendingValue: 0,
    approvedValue: 0,
    thisMonthCount: 0,
    thisMonthValue: 0
  }

  data?.forEach(ticket => {
    // Count by status
    const status = ticket.status || 'draft'
    stats[status] = (stats[status] || 0) + 1
    
    const amount = parseFloat(ticket.total_amount || 0)
    stats.totalValue += amount
    
    if (status === 'pending_review') {
      stats.pendingValue += amount
    }
    if (status === 'approved') {
      stats.approvedValue += amount
    }
    
    // This month
    if (new Date(ticket.created_at) >= thisMonth) {
      stats.thisMonthCount++
      stats.thisMonthValue += amount
    }
  })

  // Alias for backward compatibility
  stats.pending = stats.pending_review

  return stats
}
