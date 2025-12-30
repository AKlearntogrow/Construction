// src/services/ticketService.js
// 
// Ticket Service - All database operations for T&M tickets
// 
// Pragmatic Design Principles Applied:
// - Single responsibility: only handles ticket CRUD
// - Crash early: throws errors rather than hiding them
// - DRY: reusable functions for all ticket operations
// - Contract: clear input/output expectations

import { supabase } from '../lib/supabase';

// ============================================
// CREATE
// ============================================

/**
 * Create a new T&M ticket
 * @param {Object} ticketData - The ticket data from AI extraction
 * @returns {Promise<Object>} The created ticket with ID
 * @throws {Error} If database operation fails
 */
export async function createTicket(ticketData) {
  // Calculate totals before saving
  const laborTotal = calculateLaborTotal(ticketData.labor || []);
  const materialsTotal = calculateMaterialsTotal(ticketData.materials || []);
  
  const ticket = {
    description: ticketData.description || '',
    location: ticketData.location || '',
    cost_code: ticketData.cost_code || ticketData.costCode || '',
    project_name: ticketData.project_name || ticketData.project || 'Default Project',
    labor: ticketData.labor || [],
    materials: ticketData.materials || [],
    labor_total: laborTotal,
    materials_total: materialsTotal,
    total_amount: laborTotal + materialsTotal,
    original_transcript: ticketData.original_transcript || ticketData.transcript || '',
    compliance_notes: ticketData.compliance_notes || ticketData.compliance || '',
    status: ticketData.status || 'pending',
  };

  const { data, error } = await supabase
    .from('tickets')
    .insert([ticket])
    .select()
    .single();

  if (error) {
    console.error('Error creating ticket:', error);
    throw new Error(`Failed to create ticket: ${error.message}`);
  }

  return data;
}

// ============================================
// READ
// ============================================

/**
 * Get all tickets, ordered by most recent first
 * @returns {Promise<Array>} Array of tickets
 */
export async function getAllTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tickets:', error);
    throw new Error(`Failed to fetch tickets: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single ticket by ID
 * @param {string} id - The ticket UUID
 * @returns {Promise<Object>} The ticket
 */
export async function getTicketById(id) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching ticket:', error);
    throw new Error(`Failed to fetch ticket: ${error.message}`);
  }

  return data;
}

/**
 * Get tickets filtered by status
 * @param {string} status - 'pending' | 'approved' | 'rejected' | 'submitted'
 * @returns {Promise<Array>} Array of tickets with that status
 */
export async function getTicketsByStatus(status) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tickets by status:', error);
    throw new Error(`Failed to fetch tickets: ${error.message}`);
  }

  return data || [];
}

/**
 * Get the most recent N tickets
 * @param {number} limit - How many tickets to return (default 10)
 * @returns {Promise<Array>} Array of recent tickets
 */
export async function getRecentTickets(limit = 10) {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent tickets:', error);
    throw new Error(`Failed to fetch recent tickets: ${error.message}`);
  }

  return data || [];
}

// ============================================
// UPDATE
// ============================================

/**
 * Update a ticket
 * @param {string} id - The ticket UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} The updated ticket
 */
export async function updateTicket(id, updates) {
  // Recalculate totals if labor or materials changed
  if (updates.labor !== undefined || updates.materials !== undefined) {
    const currentTicket = await getTicketById(id);
    const labor = updates.labor ?? currentTicket.labor ?? [];
    const materials = updates.materials ?? currentTicket.materials ?? [];
    
    updates.labor_total = calculateLaborTotal(labor);
    updates.materials_total = calculateMaterialsTotal(materials);
    updates.total_amount = updates.labor_total + updates.materials_total;
  }

  const { data, error } = await supabase
    .from('tickets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating ticket:', error);
    throw new Error(`Failed to update ticket: ${error.message}`);
  }

  return data;
}

/**
 * Quick status update
 * @param {string} id - The ticket UUID
 * @param {string} status - New status
 * @returns {Promise<Object>} The updated ticket
 */
export async function updateTicketStatus(id, status) {
  return updateTicket(id, { status });
}

// ============================================
// DELETE
// ============================================

/**
 * Delete a ticket
 * @param {string} id - The ticket UUID
 * @returns {Promise<boolean>} True if successful
 */
export async function deleteTicket(id) {
  const { error } = await supabase
    .from('tickets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting ticket:', error);
    throw new Error(`Failed to delete ticket: ${error.message}`);
  }

  return true;
}

// ============================================
// AGGREGATE QUERIES (for Dashboard KPIs)
// ============================================

/**
 * Get statistics for dashboard KPIs
 * @returns {Promise<Object>} Stats object with counts and values
 */
export async function getTicketStats() {
  const { data, error } = await supabase
    .from('tickets')
    .select('status, total_amount, created_at');

  if (error) {
    console.error('Error fetching ticket stats:', error);
    throw new Error(`Failed to fetch stats: ${error.message}`);
  }

  // Initialize stats
  const stats = {
    total: data.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    submitted: 0,
    totalValue: 0,
    approvedValue: 0,
    pendingValue: 0,
    thisMonthCount: 0,
    thisMonthValue: 0,
  };

  // Calculate current month boundaries
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Aggregate data
  data.forEach(ticket => {
    const amount = parseFloat(ticket.total_amount) || 0;
    const createdAt = new Date(ticket.created_at);

    // Count by status
    stats[ticket.status] = (stats[ticket.status] || 0) + 1;
    
    // Sum total value
    stats.totalValue += amount;
    
    // Sum by status
    if (ticket.status === 'approved') {
      stats.approvedValue += amount;
    } else if (ticket.status === 'pending') {
      stats.pendingValue += amount;
    }

    // This month stats
    if (createdAt >= startOfMonth) {
      stats.thisMonthCount += 1;
      stats.thisMonthValue += amount;
    }
  });

  return stats;
}

/**
 * Get ticket counts grouped by status (for charts)
 * @returns {Promise<Array>} Array of {status, count} objects
 */
export async function getStatusCounts() {
  const { data, error } = await supabase
    .from('tickets')
    .select('status');

  if (error) {
    console.error('Error fetching status counts:', error);
    throw new Error(`Failed to fetch status counts: ${error.message}`);
  }

  // Count occurrences of each status
  const counts = {};
  data.forEach(ticket => {
    counts[ticket.status] = (counts[ticket.status] || 0) + 1;
  });

  // Transform to array for charts
  return Object.entries(counts).map(([status, count]) => ({
    status,
    count,
  }));
}

// ============================================
// HELPER FUNCTIONS (private)
// ============================================

/**
 * Calculate total labor cost from labor array
 * @param {Array} laborArray - Array of labor items
 * @returns {number} Total labor cost
 */
function calculateLaborTotal(laborArray) {
  if (!Array.isArray(laborArray)) return 0;
  
  return laborArray.reduce((sum, item) => {
    const hours = parseFloat(item.hours) || 0;
    const rate = parseFloat(item.rate) || 0;
    return sum + (hours * rate);
  }, 0);
}

/**
 * Calculate total materials cost from materials array
 * @param {Array} materialsArray - Array of material items
 * @returns {number} Total materials cost
 */
function calculateMaterialsTotal(materialsArray) {
  if (!Array.isArray(materialsArray)) return 0;
  
  return materialsArray.reduce((sum, item) => {
    const quantity = parseFloat(item.quantity) || 0;
    // Handle both naming conventions
    const unitCost = parseFloat(item.unit_cost || item.unitCost) || 0;
    return sum + (quantity * unitCost);
  }, 0);
}
