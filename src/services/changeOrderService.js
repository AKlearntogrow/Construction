// src/services/changeOrderService.js
//
// Change Order Service - All database operations for Change Orders
//
// Pragmatic Design:
// - Single responsibility: handles CO CRUD and ticket linking
// - Crash early: throws errors rather than hiding them
// - DRY: reusable functions

import { supabase } from '../lib/supabase';

// ============================================
// CREATE
// ============================================

/**
 * Create a new Change Order
 * @param {Object} data - { title, project_name, notes }
 * @returns {Promise<Object>} The created change order
 */
export async function createChangeOrder(data) {
  // Generate CO number
  const { data: coNumberResult, error: coNumberError } = await supabase
    .rpc('generate_co_number');

  if (coNumberError) {
    console.error('Error generating CO number:', coNumberError);
    throw new Error(`Failed to generate CO number: ${coNumberError.message}`);
  }

  const changeOrder = {
    co_number: coNumberResult,
    title: data.title,
    project_name: data.project_name || '',
    notes: data.notes || '',
    status: 'draft',
    original_amount: 0,
    current_amount: 0,
  };

  const { data: result, error } = await supabase
    .from('change_orders')
    .insert([changeOrder])
    .select()
    .single();

  if (error) {
    console.error('Error creating change order:', error);
    throw new Error(`Failed to create change order: ${error.message}`);
  }

  return result;
}

// ============================================
// READ
// ============================================

/**
 * Get all change orders
 * @returns {Promise<Array>} Array of change orders
 */
export async function getAllChangeOrders() {
  const { data, error } = await supabase
    .from('change_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching change orders:', error);
    throw new Error(`Failed to fetch change orders: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single change order by ID with its tickets
 * @param {string} id - The change order UUID
 * @returns {Promise<Object>} The change order with tickets array
 */
export async function getChangeOrderById(id) {
  // Get the change order
  const { data: changeOrder, error: coError } = await supabase
    .from('change_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (coError) {
    console.error('Error fetching change order:', coError);
    throw new Error(`Failed to fetch change order: ${coError.message}`);
  }

  // Get linked tickets
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('*')
    .eq('change_order_id', id)
    .order('created_at', { ascending: false });

  if (ticketsError) {
    console.error('Error fetching tickets:', ticketsError);
    throw new Error(`Failed to fetch tickets: ${ticketsError.message}`);
  }

  return {
    ...changeOrder,
    tickets: tickets || [],
  };
}

/**
 * Get change orders by status
 * @param {string} status - 'draft' | 'submitted' | 'approved' | 'rejected'
 * @returns {Promise<Array>} Array of change orders
 */
export async function getChangeOrdersByStatus(status) {
  const { data, error } = await supabase
    .from('change_orders')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching change orders by status:', error);
    throw new Error(`Failed to fetch change orders: ${error.message}`);
  }

  return data || [];
}

/**
 * Get change order statistics for dashboard
 * @returns {Promise<Object>} Stats object
 */
export async function getChangeOrderStats() {
  const { data, error } = await supabase
    .from('change_orders')
    .select('status, original_amount, current_amount');

  if (error) {
    console.error('Error fetching CO stats:', error);
    throw new Error(`Failed to fetch stats: ${error.message}`);
  }

  const stats = {
    total: data.length,
    draft: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    totalOriginal: 0,
    totalCurrent: 0,
    totalVariance: 0,
  };

  data.forEach(co => {
    stats[co.status] = (stats[co.status] || 0) + 1;
    stats.totalOriginal += parseFloat(co.original_amount) || 0;
    stats.totalCurrent += parseFloat(co.current_amount) || 0;
  });

  stats.totalVariance = stats.totalCurrent - stats.totalOriginal;
  stats.variancePercent = stats.totalOriginal > 0 
    ? ((stats.totalVariance / stats.totalOriginal) * 100).toFixed(1)
    : 0;

  return stats;
}

// ============================================
// UPDATE
// ============================================

/**
 * Update a change order
 * @param {string} id - The change order UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} The updated change order
 */
export async function updateChangeOrder(id, updates) {
  const { data, error } = await supabase
    .from('change_orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating change order:', error);
    throw new Error(`Failed to update change order: ${error.message}`);
  }

  return data;
}

/**
 * Submit a change order for approval
 * Locks the original_amount if this is the first submission
 * @param {string} id - The change order UUID
 * @param {string} submittedBy - Who is submitting
 * @returns {Promise<Object>} The updated change order
 */
export async function submitChangeOrder(id, submittedBy = 'User') {
  // Get current CO to check if original_amount needs to be locked
  const { data: current, error: fetchError } = await supabase
    .from('change_orders')
    .select('original_amount, current_amount')
    .eq('id', id)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch change order: ${fetchError.message}`);
  }

  const updates = {
    status: 'submitted',
    submitted_at: new Date().toISOString(),
  };

  // Lock original_amount on first submission (when it's 0)
  if (parseFloat(current.original_amount) === 0) {
    updates.original_amount = current.current_amount;
  }

  const { data, error } = await supabase
    .from('change_orders')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to submit change order: ${error.message}`);
  }

  return data;
}

/**
 * Approve a change order
 * @param {string} id - The change order UUID
 * @param {string} approvedBy - Who is approving
 * @returns {Promise<Object>} The updated change order
 */
export async function approveChangeOrder(id, approvedBy = 'Approver') {
  const { data, error } = await supabase
    .from('change_orders')
    .update({
      status: 'approved',
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to approve change order: ${error.message}`);
  }

  // Update all linked tickets to approved
  await supabase
    .from('tickets')
    .update({ status: 'approved' })
    .eq('change_order_id', id);

  return data;
}

/**
 * Reject a change order
 * @param {string} id - The change order UUID
 * @param {string} rejectedBy - Who is rejecting
 * @returns {Promise<Object>} The updated change order
 */
export async function rejectChangeOrder(id, rejectedBy = 'Approver') {
  const { data, error } = await supabase
    .from('change_orders')
    .update({
      status: 'rejected',
      approved_by: rejectedBy, // Reusing field for who made the decision
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to reject change order: ${error.message}`);
  }

  // Update all linked tickets to rejected
  await supabase
    .from('tickets')
    .update({ status: 'rejected' })
    .eq('change_order_id', id);

  return data;
}

// ============================================
// DELETE
// ============================================

/**
 * Delete a change order (only if draft)
 * @param {string} id - The change order UUID
 * @returns {Promise<boolean>} True if successful
 */
export async function deleteChangeOrder(id) {
  // First, unlink any tickets
  await supabase
    .from('tickets')
    .update({ change_order_id: null })
    .eq('change_order_id', id);

  // Then delete the CO
  const { error } = await supabase
    .from('change_orders')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting change order:', error);
    throw new Error(`Failed to delete change order: ${error.message}`);
  }

  return true;
}

// ============================================
// TICKET LINKING
// ============================================

/**
 * Add tickets to a change order
 * @param {string} changeOrderId - The change order UUID
 * @param {Array<string>} ticketIds - Array of ticket UUIDs
 * @returns {Promise<Object>} The updated change order with new total
 */
export async function addTicketsToChangeOrder(changeOrderId, ticketIds) {
  // Update tickets to link to this CO
  const { error: linkError } = await supabase
    .from('tickets')
    .update({ change_order_id: changeOrderId })
    .in('id', ticketIds);

  if (linkError) {
    throw new Error(`Failed to link tickets: ${linkError.message}`);
  }

  // Recalculate current_amount
  await recalculateChangeOrderTotal(changeOrderId);

  // Return updated CO
  return getChangeOrderById(changeOrderId);
}

/**
 * Remove a ticket from its change order
 * @param {string} ticketId - The ticket UUID
 * @param {string} changeOrderId - The change order UUID (to recalculate)
 * @returns {Promise<Object>} The updated change order
 */
export async function removeTicketFromChangeOrder(ticketId, changeOrderId) {
  // Unlink the ticket
  const { error } = await supabase
    .from('tickets')
    .update({ change_order_id: null })
    .eq('id', ticketId);

  if (error) {
    throw new Error(`Failed to unlink ticket: ${error.message}`);
  }

  // Recalculate total
  await recalculateChangeOrderTotal(changeOrderId);

  return getChangeOrderById(changeOrderId);
}

/**
 * Recalculate a change order's current_amount from its tickets
 * @param {string} changeOrderId - The change order UUID
 */
async function recalculateChangeOrderTotal(changeOrderId) {
  // Get sum of linked tickets
  const { data: tickets, error: fetchError } = await supabase
    .from('tickets')
    .select('total_amount')
    .eq('change_order_id', changeOrderId);

  if (fetchError) {
    throw new Error(`Failed to fetch tickets: ${fetchError.message}`);
  }

  const total = tickets.reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0);

  // Update the CO
  const { error: updateError } = await supabase
    .from('change_orders')
    .update({ current_amount: total })
    .eq('id', changeOrderId);

  if (updateError) {
    throw new Error(`Failed to update total: ${updateError.message}`);
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Get tickets not assigned to any change order
 * @returns {Promise<Array>} Array of unassigned tickets
 */
export async function getUnassignedTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .is('change_order_id', null)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch unassigned tickets: ${error.message}`);
  }

  return data || [];
}

/**
 * Calculate variance for a change order
 * @param {Object} changeOrder - The change order object
 * @returns {Object} { amount, percent, isOverBudget }
 */
export function calculateVariance(changeOrder) {
  const original = parseFloat(changeOrder.original_amount) || 0;
  const current = parseFloat(changeOrder.current_amount) || 0;
  const amount = current - original;
  const percent = original > 0 ? ((amount / original) * 100) : 0;

  return {
    amount,
    percent: percent.toFixed(1),
    isOverBudget: amount > 0,
  };
}
