/**
 * Cost Code Service - Industry Standard Schema
 * Handles CSI MasterFormat cost codes
 */

import { supabase } from '../lib/supabase'

/**
 * Get all global cost codes
 */
export async function getGlobalCostCodes() {
  const { data, error } = await supabase
    .from('cost_codes')
    .select('*')
    .eq('is_global', true)
    .eq('status', 'active')
    .order('code')

  if (error) throw error
  return data
}

/**
 * Get cost codes for a project (global + project-specific)
 */
export async function getCostCodesByProject(projectId) {
  const { data, error } = await supabase
    .from('cost_codes')
    .select('*')
    .or(`is_global.eq.true,project_id.eq.${projectId}`)
    .eq('status', 'active')
    .order('code')

  if (error) throw error
  return data
}

/**
 * Search cost codes by code or name
 */
export async function searchCostCodes(query, projectId = null) {
  let supabaseQuery = supabase
    .from('cost_codes')
    .select('*')
    .eq('status', 'active')
    .or(`code.ilike.%${query}%,name.ilike.%${query}%`)
    .order('code')
    .limit(20)

  if (projectId) {
    supabaseQuery = supabaseQuery.or(`is_global.eq.true,project_id.eq.${projectId}`)
  } else {
    supabaseQuery = supabaseQuery.eq('is_global', true)
  }

  const { data, error } = await supabaseQuery

  if (error) throw error
  return data
}

export const COST_TYPES = [
  { value: 'labor', label: 'Labor' },
  { value: 'material', label: 'Material' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'subcontract', label: 'Subcontract' },
  { value: 'other', label: 'Other' },
]
