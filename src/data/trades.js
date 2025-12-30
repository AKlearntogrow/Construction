// src/data/trades.js
//
// Standard construction trades for dropdown selection
// These are common CSI/labor classification trades

export const CONSTRUCTION_TRADES = [
  { value: 'electrician', label: 'Electrician' },
  { value: 'plumber', label: 'Plumber' },
  { value: 'hvac_technician', label: 'HVAC Technician' },
  { value: 'carpenter', label: 'Carpenter' },
  { value: 'painter', label: 'Painter' },
  { value: 'mason', label: 'Mason' },
  { value: 'roofer', label: 'Roofer' },
  { value: 'welder', label: 'Welder' },
  { value: 'pipefitter', label: 'Pipefitter' },
  { value: 'sheet_metal_worker', label: 'Sheet Metal Worker' },
  { value: 'ironworker', label: 'Ironworker' },
  { value: 'laborer', label: 'Laborer' },
  { value: 'foreman', label: 'Foreman' },
  { value: 'superintendent', label: 'Superintendent' },
  { value: 'equipment_operator', label: 'Equipment Operator' },
  { value: 'concrete_finisher', label: 'Concrete Finisher' },
  { value: 'drywall_installer', label: 'Drywall Installer' },
  { value: 'insulation_worker', label: 'Insulation Worker' },
  { value: 'glazier', label: 'Glazier' },
  { value: 'flooring_installer', label: 'Flooring Installer' },
  { value: 'tile_setter', label: 'Tile Setter' },
  { value: 'fire_sprinkler_fitter', label: 'Fire Sprinkler Fitter' },
  { value: 'millwright', label: 'Millwright' },
  { value: 'boilermaker', label: 'Boilermaker' },
  { value: 'elevator_mechanic', label: 'Elevator Mechanic' },
  { value: 'other', label: 'Other' },
];

// Helper to get label from value
export function getTradeLabel(value) {
  const trade = CONSTRUCTION_TRADES.find(t => t.value === value || t.label.toLowerCase() === value?.toLowerCase());
  return trade?.label || value;
}

// Helper to find matching trade from AI extraction
export function matchTrade(aiTrade) {
  if (!aiTrade) return 'laborer';
  
  const normalized = aiTrade.toLowerCase().replace(/[^a-z]/g, '');
  
  // Direct match
  const directMatch = CONSTRUCTION_TRADES.find(t => 
    t.value === normalized || 
    t.label.toLowerCase().replace(/[^a-z]/g, '') === normalized
  );
  if (directMatch) return directMatch.value;
  
  // Partial match
  const partialMatch = CONSTRUCTION_TRADES.find(t => 
    normalized.includes(t.value.replace('_', '')) ||
    t.label.toLowerCase().replace(/[^a-z]/g, '').includes(normalized)
  );
  if (partialMatch) return partialMatch.value;
  
  // Default
  return 'other';
}
