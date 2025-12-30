// src/services/projectService.js
//
// Project Service - CRUD operations for Projects
//
// Projects are lookup entities - typically created by admins
// and selected by field workers when creating tickets

import { supabase } from '../lib/supabase';
import { validateProject, sanitizeCurrency } from '../utils/validation';

// ============================================
// CREATE
// ============================================

/**
 * Create a new project
 * @param {Object} data - { name, client_name, original_budget, start_date, end_date, notes }
 * @returns {Promise<Object>} The created project
 */
export async function createProject(data) {
  // Validate input
  const validation = validateProject(data);
  if (!validation.valid) {
    throw new Error(validation.errors.join(', '));
  }

  // Generate project code
  const { data: projectCode, error: codeError } = await supabase
    .rpc('generate_project_code');

  if (codeError) {
    console.error('Error generating project code:', codeError);
    throw new Error(`Failed to generate project code: ${codeError.message}`);
  }

  const project = {
    project_code: projectCode,
    ...validation.value,
  };

  const { data: result, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    throw new Error(`Failed to create project: ${error.message}`);
  }

  return result;
}

// ============================================
// READ
// ============================================

/**
 * Get all projects
 * @param {Object} options - { status, includeStats }
 * @returns {Promise<Array>} Array of projects
 */
export async function getAllProjects(options = {}) {
  const { status, includeStats = false } = options;

  let query = supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching projects:', error);
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  // If stats requested, fetch ticket/CO counts for each project
  if (includeStats && data.length > 0) {
    return Promise.all(data.map(async (project) => {
      const stats = await getProjectStats(project.id);
      return { ...project, stats };
    }));
  }

  return data || [];
}

/**
 * Get active projects (for dropdowns)
 * @returns {Promise<Array>} Array of active projects
 */
export async function getActiveProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, project_code, name, client_name, original_budget')
    .eq('status', 'active')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching active projects:', error);
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single project by ID
 * @param {string} id - Project UUID
 * @returns {Promise<Object>} The project
 */
export async function getProjectById(id) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    throw new Error(`Failed to fetch project: ${error.message}`);
  }

  return data;
}

/**
 * Get project with full stats
 * @param {string} id - Project UUID
 * @returns {Promise<Object>} Project with tickets, COs, and budget summary
 */
export async function getProjectWithDetails(id) {
  // Get project
  const project = await getProjectById(id);

  // Get stats
  const stats = await getProjectStats(id);

  // Get recent tickets
  const { data: tickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Get change orders
  const { data: changeOrders } = await supabase
    .from('change_orders')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  return {
    ...project,
    stats,
    tickets: tickets || [],
    changeOrders: changeOrders || [],
  };
}

/**
 * Get statistics for a project
 * @param {string} projectId - Project UUID
 * @returns {Promise<Object>} Stats object
 */
export async function getProjectStats(projectId) {
  // Get tickets for this project
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('total_amount, status, change_order_id')
    .eq('project_id', projectId);

  if (ticketsError) {
    console.error('Error fetching ticket stats:', ticketsError);
    return null;
  }

  // Get change orders for this project
  const { data: changeOrders, error: coError } = await supabase
    .from('change_orders')
    .select('status, current_amount, original_amount')
    .eq('project_id', projectId);

  if (coError) {
    console.error('Error fetching CO stats:', coError);
    return null;
  }

  // Calculate stats
  const stats = {
    ticketCount: tickets.length,
    ticketsUnassigned: tickets.filter(t => !t.change_order_id).length,
    ticketsTotal: tickets.reduce((sum, t) => sum + (parseFloat(t.total_amount) || 0), 0),
    
    coCount: changeOrders.length,
    coDraft: changeOrders.filter(co => co.status === 'draft').length,
    coSubmitted: changeOrders.filter(co => co.status === 'submitted').length,
    coApproved: changeOrders.filter(co => co.status === 'approved').length,
    coRejected: changeOrders.filter(co => co.status === 'rejected').length,
    
    coApprovedValue: changeOrders
      .filter(co => co.status === 'approved')
      .reduce((sum, co) => sum + (parseFloat(co.current_amount) || 0), 0),
    
    coPendingValue: changeOrders
      .filter(co => co.status === 'submitted')
      .reduce((sum, co) => sum + (parseFloat(co.current_amount) || 0), 0),
  };

  return stats;
}

// ============================================
// UPDATE
// ============================================

/**
 * Update a project
 * @param {string} id - Project UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} The updated project
 */
export async function updateProject(id, updates) {
  // Validate updates (partial validation)
  const toUpdate = {};

  if (updates.name !== undefined) {
    const validation = validateProject({ name: updates.name, original_budget: 0 });
    if (!validation.valid) {
      throw new Error(validation.errors.join(', '));
    }
    toUpdate.name = validation.value.name;
  }

  if (updates.client_name !== undefined) {
    toUpdate.client_name = updates.client_name?.trim() || null;
  }

  if (updates.original_budget !== undefined) {
    toUpdate.original_budget = sanitizeCurrency(updates.original_budget);
  }

  if (updates.status !== undefined) {
    const validStatuses = ['active', 'completed', 'on-hold', 'cancelled'];
    if (!validStatuses.includes(updates.status)) {
      throw new Error('Invalid status');
    }
    toUpdate.status = updates.status;
  }

  if (updates.start_date !== undefined) toUpdate.start_date = updates.start_date;
  if (updates.end_date !== undefined) toUpdate.end_date = updates.end_date;
  if (updates.notes !== undefined) toUpdate.notes = updates.notes?.trim() || null;

  const { data, error } = await supabase
    .from('projects')
    .update(toUpdate)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    throw new Error(`Failed to update project: ${error.message}`);
  }

  return data;
}

// ============================================
// DELETE
// ============================================

/**
 * Delete a project (only if no tickets or COs attached)
 * @param {string} id - Project UUID
 * @returns {Promise<boolean>} True if successful
 */
export async function deleteProject(id) {
  // Check for linked tickets
  const { count: ticketCount } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id);

  if (ticketCount > 0) {
    throw new Error(`Cannot delete project with ${ticketCount} linked tickets`);
  }

  // Check for linked change orders
  const { count: coCount } = await supabase
    .from('change_orders')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', id);

  if (coCount > 0) {
    throw new Error(`Cannot delete project with ${coCount} linked change orders`);
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting project:', error);
    throw new Error(`Failed to delete project: ${error.message}`);
  }

  return true;
}

// ============================================
// BUDGET HELPERS
// ============================================

/**
 * Calculate budget summary for a project
 * @param {string} projectId - Project UUID
 * @returns {Promise<Object>} Budget summary
 */
export async function getProjectBudgetSummary(projectId) {
  const project = await getProjectById(projectId);
  const stats = await getProjectStats(projectId);

  const originalBudget = parseFloat(project.original_budget) || 0;
  const approvedCOs = stats?.coApprovedValue || 0;
  const pendingCOs = stats?.coPendingValue || 0;
  const currentTotal = originalBudget + approvedCOs;
  const projectedTotal = currentTotal + pendingCOs;

  return {
    originalBudget,
    approvedCOs,
    pendingCOs,
    currentTotal,
    projectedTotal,
    remaining: originalBudget - approvedCOs,
    remainingIfPendingApproved: originalBudget - approvedCOs - pendingCOs,
    percentUsed: originalBudget > 0 ? ((approvedCOs / originalBudget) * 100).toFixed(1) : 0,
    percentProjected: originalBudget > 0 ? (((approvedCOs + pendingCOs) / originalBudget) * 100).toFixed(1) : 0,
  };
}
