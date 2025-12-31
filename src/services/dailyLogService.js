/**
 * Daily Log Service - Industry Standard Schema
 * Handles daily site activity records
 */

import { supabase } from '../lib/supabase'

/**
 * Get all daily logs for a project
 */
export async function getDailyLogsByProject(projectId) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select(`
      *,
      labor:daily_log_labor(*),
      equipment:daily_log_equipment(*)
    `)
    .eq('project_id', projectId)
    .order('log_date', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get daily log by ID
 */
export async function getDailyLogById(id) {
  const { data, error } = await supabase
    .from('daily_logs')
    .select(`
      *,
      labor:daily_log_labor(*),
      equipment:daily_log_equipment(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

/**
 * Create a new daily log
 */
export async function createDailyLog(logData) {
  const { data, error } = await supabase
    .from('daily_logs')
    .insert([{
      project_id: logData.project_id,
      log_date: logData.log_date || new Date().toISOString().split('T')[0],
      weather_condition: logData.weather_condition,
      temperature_high: logData.temperature_high,
      temperature_low: logData.temperature_low,
      work_performed: logData.work_performed,
      work_planned_tomorrow: logData.work_planned_tomorrow,
      delays: logData.delays,
      notes: logData.notes,
      status: 'draft'
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update a daily log
 */
export async function updateDailyLog(id, updates) {
  const { data, error } = await supabase
    .from('daily_logs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const WEATHER_CONDITIONS = [
  { value: 'clear', label: 'Clear' },
  { value: 'partly_cloudy', label: 'Partly Cloudy' },
  { value: 'cloudy', label: 'Cloudy' },
  { value: 'rain', label: 'Rain' },
  { value: 'snow', label: 'Snow' },
  { value: 'fog', label: 'Fog' },
  { value: 'wind', label: 'Windy' },
  { value: 'storm', label: 'Storm' },
]
