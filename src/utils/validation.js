// src/utils/validation.js
//
// Centralized validation utilities
// Used by both services and React components
//
// Pragmatic Design:
// - Single source of truth for validation rules
// - Returns user-friendly error messages
// - Sanitizes inputs before database operations

// ============================================
// REGEX PATTERNS
// ============================================

const PATTERNS = {
  // Letters, numbers, spaces, hyphens, apostrophes, periods
  NAME: /^[a-zA-Z0-9\s\-'\.]{2,100}$/,
  
  // Uppercase letters, numbers, hyphens (3-20 chars)
  PROJECT_CODE: /^[A-Z0-9\-]{3,20}$/,
  
  // CO number format: CO-YYYY-NNN
  CO_NUMBER: /^CO-[0-9]{4}-[0-9]{3}$/,
  
  // Title with more allowed characters (2-200 chars)
  TITLE: /^[a-zA-Z0-9\s\-'\.,:;()]{2,200}$/,
  
  // Description - more permissive (2-2000 chars)
  DESCRIPTION: /^[\w\s\-'\.,:;()!?@#$%&*+=]{2,2000}$/,
  
  // Location - letters, numbers, spaces, common punctuation
  LOCATION: /^[a-zA-Z0-9\s\-'\.,:;()#]{2,200}$/,
  
  // Cost code - alphanumeric with spaces and hyphens
  COST_CODE: /^[a-zA-Z0-9\s\-\.]{2,50}$/,
};

// ============================================
// CURRENCY VALIDATION
// ============================================

/**
 * Validate a currency value
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of field for error message
 * @returns {{ valid: boolean, error?: string, value?: number }}
 */
export function validateCurrency(value, fieldName = 'Amount') {
  // Handle empty/null
  if (value === null || value === undefined || value === '') {
    return { valid: true, value: 0 };
  }

  // Convert to number
  const num = typeof value === 'string' ? parseFloat(value.replace(/[,$]/g, '')) : Number(value);

  // Check if valid number
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  // Check non-negative
  if (num < 0) {
    return { valid: false, error: `${fieldName} cannot be negative` };
  }

  // Check max value
  if (num > 999999999.99) {
    return { valid: false, error: `${fieldName} exceeds maximum allowed value` };
  }

  // Round to 2 decimal places
  const rounded = Math.round(num * 100) / 100;

  return { valid: true, value: rounded };
}

/**
 * Validate and sanitize a currency input (returns number or 0)
 */
export function sanitizeCurrency(value) {
  const result = validateCurrency(value);
  return result.valid ? result.value : 0;
}

// ============================================
// NUMBER VALIDATION (hours, quantity, etc.)
// ============================================

/**
 * Validate a positive number
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of field for error message
 * @param {Object} options - { min, max, allowZero, decimals }
 */
export function validateNumber(value, fieldName = 'Value', options = {}) {
  const { min = 0, max = 999999, allowZero = true, decimals = 2 } = options;

  if (value === null || value === undefined || value === '') {
    return allowZero ? { valid: true, value: 0 } : { valid: false, error: `${fieldName} is required` };
  }

  const num = typeof value === 'string' ? parseFloat(value) : Number(value);

  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a valid number` };
  }

  if (!allowZero && num === 0) {
    return { valid: false, error: `${fieldName} must be greater than zero` };
  }

  if (num < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }

  if (num > max) {
    return { valid: false, error: `${fieldName} must not exceed ${max}` };
  }

  // Round to specified decimals
  const multiplier = Math.pow(10, decimals);
  const rounded = Math.round(num * multiplier) / multiplier;

  return { valid: true, value: rounded };
}

// ============================================
// TEXT VALIDATION
// ============================================

/**
 * Validate a text field against a pattern
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of field for error message
 * @param {RegExp} pattern - Regex pattern to match
 * @param {string} hint - Hint for what's allowed
 */
export function validateText(value, fieldName, pattern, hint) {
  if (!value || value.trim() === '') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmed = value.trim();

  if (!pattern.test(trimmed)) {
    return { valid: false, error: `${fieldName} contains invalid characters. ${hint}` };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate a name field (project name, client name, etc.)
 */
export function validateName(value, fieldName = 'Name', required = true) {
  if (!value || value.trim() === '') {
    return required 
      ? { valid: false, error: `${fieldName} is required` }
      : { valid: true, value: '' };
  }

  return validateText(
    value, 
    fieldName, 
    PATTERNS.NAME, 
    'Use only letters, numbers, spaces, hyphens, and periods (2-100 characters).'
  );
}

/**
 * Validate a title field
 */
export function validateTitle(value, fieldName = 'Title') {
  return validateText(
    value,
    fieldName,
    PATTERNS.TITLE,
    'Use only letters, numbers, spaces, and basic punctuation (2-200 characters).'
  );
}

/**
 * Validate a description field (more permissive)
 */
export function validateDescription(value, fieldName = 'Description', required = false) {
  if (!value || value.trim() === '') {
    return required
      ? { valid: false, error: `${fieldName} is required` }
      : { valid: true, value: '' };
  }

  const trimmed = value.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters` };
  }
  
  if (trimmed.length > 2000) {
    return { valid: false, error: `${fieldName} must not exceed 2000 characters` };
  }

  return { valid: true, value: trimmed };
}

/**
 * Validate project code
 */
export function validateProjectCode(value) {
  if (!value || value.trim() === '') {
    return { valid: false, error: 'Project code is required' };
  }

  const upper = value.trim().toUpperCase();

  if (!PATTERNS.PROJECT_CODE.test(upper)) {
    return { 
      valid: false, 
      error: 'Project code must be 3-20 characters: uppercase letters, numbers, and hyphens only' 
    };
  }

  return { valid: true, value: upper };
}

// ============================================
// LABOR & MATERIALS VALIDATION
// ============================================

/**
 * Validate a labor entry
 * @param {Object} labor - { trade, workers, hours, rate }
 */
export function validateLaborEntry(labor) {
  const errors = [];

  // Trade (optional but if provided, must be valid)
  if (labor.trade && !PATTERNS.NAME.test(labor.trade)) {
    errors.push('Trade name contains invalid characters');
  }

  // Workers
  const workersResult = validateNumber(labor.workers, 'Workers', { min: 1, max: 1000, allowZero: false, decimals: 0 });
  if (!workersResult.valid) errors.push(workersResult.error);

  // Hours
  const hoursResult = validateNumber(labor.hours, 'Hours', { min: 0.25, max: 9999, allowZero: false });
  if (!hoursResult.valid) errors.push(hoursResult.error);

  // Rate
  const rateResult = validateCurrency(labor.rate, 'Hourly rate');
  if (!rateResult.valid) errors.push(rateResult.error);
  if (rateResult.valid && rateResult.value <= 0) errors.push('Hourly rate must be greater than zero');

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    value: {
      trade: labor.trade?.trim() || '',
      workers: workersResult.value,
      hours: hoursResult.value,
      rate: rateResult.value,
      total: workersResult.value * hoursResult.value * rateResult.value,
    }
  };
}

/**
 * Validate a material entry
 * @param {Object} material - { item, quantity, unit, unit_cost }
 */
export function validateMaterialEntry(material) {
  const errors = [];

  // Item name
  if (!material.item || material.item.trim() === '') {
    errors.push('Material item name is required');
  } else if (!PATTERNS.NAME.test(material.item)) {
    errors.push('Material item name contains invalid characters');
  }

  // Quantity
  const qtyResult = validateNumber(material.quantity, 'Quantity', { min: 0.01, max: 999999, allowZero: false });
  if (!qtyResult.valid) errors.push(qtyResult.error);

  // Unit cost
  const costResult = validateCurrency(material.unit_cost || material.unitCost, 'Unit cost');
  if (!costResult.valid) errors.push(costResult.error);

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    value: {
      item: material.item.trim(),
      quantity: qtyResult.value,
      unit: material.unit?.trim() || 'each',
      unit_cost: costResult.value,
      total: qtyResult.value * costResult.value,
    }
  };
}

// ============================================
// COMPLETE TICKET VALIDATION
// ============================================

/**
 * Validate a complete ticket before saving
 * @param {Object} ticket - Full ticket object
 */
export function validateTicket(ticket) {
  const errors = [];
  const sanitized = {};

  // Project ID (required)
  if (!ticket.project_id) {
    errors.push('Project is required');
  } else {
    sanitized.project_id = ticket.project_id;
  }

  // Description
  const descResult = validateDescription(ticket.description, 'Description', false);
  if (!descResult.valid) errors.push(descResult.error);
  else sanitized.description = descResult.value;

  // Location
  if (ticket.location) {
    const locResult = validateDescription(ticket.location, 'Location', false);
    if (!locResult.valid) errors.push(locResult.error);
    else sanitized.location = locResult.value;
  }

  // Cost code
  if (ticket.cost_code) {
    sanitized.cost_code = ticket.cost_code.trim();
  }

  // Labor entries
  let laborTotal = 0;
  sanitized.labor = [];
  if (Array.isArray(ticket.labor)) {
    ticket.labor.forEach((entry, idx) => {
      const result = validateLaborEntry(entry);
      if (!result.valid) {
        result.errors.forEach(e => errors.push(`Labor ${idx + 1}: ${e}`));
      } else {
        sanitized.labor.push(result.value);
        laborTotal += result.value.total;
      }
    });
  }

  // Materials entries
  let materialsTotal = 0;
  sanitized.materials = [];
  if (Array.isArray(ticket.materials)) {
    ticket.materials.forEach((entry, idx) => {
      const result = validateMaterialEntry(entry);
      if (!result.valid) {
        result.errors.forEach(e => errors.push(`Material ${idx + 1}: ${e}`));
      } else {
        sanitized.materials.push(result.value);
        materialsTotal += result.value.total;
      }
    });
  }

  // Calculate totals
  sanitized.labor_total = Math.round(laborTotal * 100) / 100;
  sanitized.materials_total = Math.round(materialsTotal * 100) / 100;
  sanitized.total_amount = sanitized.labor_total + sanitized.materials_total;

  // Must have some value
  if (sanitized.total_amount === 0 && sanitized.labor.length === 0 && sanitized.materials.length === 0) {
    errors.push('Ticket must have at least one labor entry or material');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, value: sanitized };
}

// ============================================
// PROJECT VALIDATION
// ============================================

/**
 * Validate a project before saving
 * @param {Object} project - Project object
 */
export function validateProject(project) {
  const errors = [];
  const sanitized = {};

  // Name (required)
  const nameResult = validateName(project.name, 'Project name', true);
  if (!nameResult.valid) errors.push(nameResult.error);
  else sanitized.name = nameResult.value;

  // Client name (optional)
  if (project.client_name) {
    const clientResult = validateName(project.client_name, 'Client name', false);
    if (!clientResult.valid) errors.push(clientResult.error);
    else sanitized.client_name = clientResult.value;
  }

  // Budget
  const budgetResult = validateCurrency(project.original_budget, 'Budget');
  if (!budgetResult.valid) errors.push(budgetResult.error);
  else sanitized.original_budget = budgetResult.value;

  // Dates
  if (project.start_date) sanitized.start_date = project.start_date;
  if (project.end_date) sanitized.end_date = project.end_date;

  // Validate date range
  if (sanitized.start_date && sanitized.end_date) {
    if (new Date(sanitized.end_date) < new Date(sanitized.start_date)) {
      errors.push('End date must be after start date');
    }
  }

  // Status
  const validStatuses = ['active', 'completed', 'on-hold', 'cancelled'];
  if (project.status && !validStatuses.includes(project.status)) {
    errors.push('Invalid project status');
  } else {
    sanitized.status = project.status || 'active';
  }

  // Notes
  if (project.notes) {
    sanitized.notes = project.notes.trim().substring(0, 2000);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, value: sanitized };
}

// ============================================
// CHANGE ORDER VALIDATION
// ============================================

/**
 * Validate a change order before saving
 * @param {Object} co - Change order object
 */
export function validateChangeOrder(co) {
  const errors = [];
  const sanitized = {};

  // Project ID (required)
  if (!co.project_id) {
    errors.push('Project is required');
  } else {
    sanitized.project_id = co.project_id;
  }

  // Title (required)
  const titleResult = validateTitle(co.title, 'Title');
  if (!titleResult.valid) errors.push(titleResult.error);
  else sanitized.title = titleResult.value;

  // Notes (optional)
  if (co.notes) {
    sanitized.notes = co.notes.trim().substring(0, 2000);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, value: sanitized };
}

// ============================================
// FORMATTING HELPERS
// ============================================

/**
 * Format a number as currency string
 */
export function formatCurrency(value) {
  const num = sanitizeCurrency(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

/**
 * Format errors array into a single message
 */
export function formatErrors(errors) {
  if (!Array.isArray(errors)) return errors;
  if (errors.length === 1) return errors[0];
  return errors.map((e, i) => `${i + 1}. ${e}`).join('\n');
}
