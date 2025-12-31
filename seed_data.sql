-- ============================================================================
-- SEED DATA FOR CHANGEFLOW AI - Stress Test
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, let's create 5 projects
INSERT INTO projects (name, project_code, project_type, description, address, city, state, status, budget, original_contract_value, current_contract_value, planned_start_date, planned_end_date, default_labor_rate, markup_percent) VALUES
('Metro Center Tower', 'PRJ-25-0001', 'commercial', 'Mixed-use 42-story tower with retail and office space', '100 Main Street', 'Austin', 'TX', 'active', 85000000, 78500000, 78500000, '2024-06-01', '2026-12-31', 85.00, 15),
('Harbor View Medical', 'PRJ-25-0002', 'healthcare', 'Regional medical center expansion - 3 new wings', '2500 Harbor Blvd', 'Houston', 'TX', 'active', 125000000, 118000000, 118000000, '2024-03-15', '2027-06-30', 92.00, 12),
('Riverside Apartments', 'PRJ-25-0003', 'residential', '280-unit luxury apartment complex with amenities', '750 River Road', 'Dallas', 'TX', 'active', 45000000, 42000000, 42000000, '2024-09-01', '2026-03-31', 75.00, 18),
('Tech Campus Phase 2', 'PRJ-25-0004', 'commercial', 'Corporate campus expansion - 4 buildings', '8000 Innovation Way', 'San Antonio', 'TX', 'pre_construction', 95000000, 89000000, 89000000, '2025-02-01', '2027-08-31', 88.00, 14),
('Downtown Parking Structure', 'PRJ-25-0005', 'infrastructure', '8-level parking garage with EV charging', '300 Commerce St', 'Austin', 'TX', 'active', 28000000, 25500000, 25500000, '2024-07-15', '2025-09-30', 72.00, 16);

-- Get project IDs for reference (we'll use subqueries)
-- Now create 50+ T&M Tickets spread across projects

INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status, original_transcript) 
SELECT 
  p.id,
  'Emergency waterproofing repair on level 12 due to storm damage',
  'Floor 12, East Wing',
  '2024-12-15',
  '[{"trade": "Waterproofer", "workers": 4, "hours": 10, "rate": 85}]'::jsonb,
  3400,
  '[{"item": "Waterproof membrane", "quantity": 200, "unit": "sqft", "unit_cost": 8.50}]'::jsonb,
  1700,
  5100,
  'approved',
  'We had 4 waterproofers working 10 hours each on floor 12 east wing, fixing storm damage. Used 200 square feet of membrane.'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Structural steel modifications per RFI-042', 'Floors 8-10, Core', '2024-12-14',
  '[{"trade": "Ironworker", "workers": 6, "hours": 8, "rate": 95}]'::jsonb, 4560,
  '[{"item": "Steel plates", "quantity": 12, "unit": "ea", "unit_cost": 450}]'::jsonb, 5400, 9960, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'HVAC ductwork reroute for design change', 'Floor 15, Mechanical Room', '2024-12-13',
  '[{"trade": "Sheet Metal Worker", "workers": 3, "hours": 12, "rate": 78}]'::jsonb, 2808,
  '[{"item": "Galvanized duct", "quantity": 150, "unit": "lf", "unit_cost": 22}]'::jsonb, 3300, 6108, 'pending_review'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Electrical panel relocation owner request', 'Floor 20, Suite 2001', '2024-12-12',
  '[{"trade": "Electrician", "workers": 2, "hours": 16, "rate": 88}]'::jsonb, 2816,
  '[{"item": "Panel board", "quantity": 1, "unit": "ea", "unit_cost": 2800}, {"item": "Conduit", "quantity": 200, "unit": "lf", "unit_cost": 12}]'::jsonb, 5200, 8016, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Concrete patch and repair garage level', 'Parking Level B2', '2024-12-11',
  '[{"trade": "Cement Mason", "workers": 3, "hours": 8, "rate": 72}]'::jsonb, 1728,
  '[{"item": "Repair mortar", "quantity": 40, "unit": "bag", "unit_cost": 35}]'::jsonb, 1400, 3128, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

-- More tickets for Metro Center Tower
INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Fire stopping installation at floor penetrations', 'Floors 5-10', '2024-12-10',
  '[{"trade": "Firestopper", "workers": 4, "hours": 10, "rate": 68}]'::jsonb, 2720,
  '[{"item": "Firestop sealant", "quantity": 50, "unit": "tube", "unit_cost": 28}]'::jsonb, 1400, 4120, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Window frame remediation water intrusion', 'Floor 18, North Face', '2024-12-09',
  '[{"trade": "Glazier", "workers": 2, "hours": 14, "rate": 82}]'::jsonb, 2296,
  '[{"item": "Sealant", "quantity": 24, "unit": "tube", "unit_cost": 45}, {"item": "Backer rod", "quantity": 500, "unit": "lf", "unit_cost": 1.5}]'::jsonb, 1830, 4126, 'pending_review'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Plumbing rough-in changes per architect', 'Floor 22, Restrooms', '2024-12-08',
  '[{"trade": "Plumber", "workers": 3, "hours": 10, "rate": 86}]'::jsonb, 2580,
  '[{"item": "Copper pipe", "quantity": 100, "unit": "lf", "unit_cost": 18}, {"item": "Fittings", "quantity": 1, "unit": "lot", "unit_cost": 650}]'::jsonb, 2450, 5030, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

-- Harbor View Medical tickets
INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Medical gas piping installation change order', 'Wing B, Floor 3', '2024-12-15',
  '[{"trade": "Pipefitter", "workers": 4, "hours": 12, "rate": 92}]'::jsonb, 4416,
  '[{"item": "Medical gas pipe", "quantity": 300, "unit": "lf", "unit_cost": 45}]'::jsonb, 13500, 17916, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0002';

INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Lead abatement in existing structure', 'Wing A, Basement', '2024-12-14',
  '[{"trade": "Laborer", "workers": 6, "hours": 8, "rate": 65}]'::jsonb, 3120,
  '[{"item": "Abatement supplies", "quantity": 1, "unit": "lot", "unit_cost": 4500}]'::jsonb, 4500, 7620, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0002';

INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Emergency generator pad modification', 'Wing C, Exterior', '2024-12-13',
  '[{"trade": "Cement Mason", "workers": 4, "hours": 6, "rate": 72}]'::jsonb, 1728,
  '[{"item": "Concrete", "quantity": 8, "unit": "cy", "unit_cost": 185}]'::jsonb, 1480, 3208, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0002';

INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Isolation room HVAC modifications', 'Wing B, Floor 4', '2024-12-12',
  '[{"trade": "Sheet Metal Worker", "workers": 3, "hours": 14, "rate": 78}]'::jsonb, 3276,
  '[{"item": "HEPA filtration unit", "quantity": 2, "unit": "ea", "unit_cost": 3500}]'::jsonb, 7000, 10276, 'pending_review'
FROM projects p WHERE p.project_code = 'PRJ-25-0002';

INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Nurse call system rewiring', 'Wing A, Floor 2', '2024-12-11',
  '[{"trade": "Electrician", "workers": 2, "hours": 20, "rate": 88}]'::jsonb, 3520,
  '[{"item": "Low voltage cable", "quantity": 2000, "unit": "lf", "unit_cost": 2.5}]'::jsonb, 5000, 8520, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0002';

INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Radiation shielding installation', 'Wing C, Floor 1 Imaging', '2024-12-10',
  '[{"trade": "Carpenter", "workers": 4, "hours": 16, "rate": 75}]'::jsonb, 4800,
  '[{"item": "Lead-lined drywall", "quantity": 800, "unit": "sqft", "unit_cost": 35}]'::jsonb, 28000, 32800, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0002';

-- Riverside Apartments tickets
INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Balcony waterproofing upgrade per spec change', 'Building A, Units 101-120', '2024-12-15',
  '[{"trade": "Waterproofer", "workers": 5, "hours": 8, "rate": 85}]'::jsonb, 3400,
  '[{"item": "Deck coating", "quantity": 400, "unit": "sqft", "unit_cost": 12}]'::jsonb, 4800, 8200, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0003';

INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Kitchen cabinet upgrade owner request', 'Building B, Units 201-210', '2024-12-14',
  '[{"trade": "Carpenter", "workers": 3, "hours": 10, "rate": 75}]'::jsonb, 2250,
  '[{"item": "Premium cabinets", "quantity": 10, "unit": "set", "unit_cost": 1800}]'::jsonb, 18000, 20250, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0003';

INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Pool equipment room modifications', 'Amenity Building', '2024-12-13',
  '[{"trade": "Plumber", "workers": 2, "hours": 12, "rate": 86}]'::jsonb, 2064,
  '[{"item": "Pool pump", "quantity": 1, "unit": "ea", "unit_cost": 4500}, {"item": "PVC pipe", "quantity": 150, "unit": "lf", "unit_cost": 8}]'::jsonb, 5700, 7764, 'pending_review'
FROM projects p WHERE p.project_code = 'PRJ-25-0003';

INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Parking lot lighting upgrade', 'Surface Lot A', '2024-12-12',
  '[{"trade": "Electrician", "workers": 3, "hours": 8, "rate": 88}]'::jsonb, 2112,
  '[{"item": "LED fixtures", "quantity": 24, "unit": "ea", "unit_cost": 450}]'::jsonb, 10800, 12912, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0003';

-- Downtown Parking Structure tickets
INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'EV charging station conduit installation', 'Level 2', '2024-12-15',
  '[{"trade": "Electrician", "workers": 4, "hours": 10, "rate": 88}]'::jsonb, 3520,
  '[{"item": "Conduit", "quantity": 500, "unit": "lf", "unit_cost": 15}]'::jsonb, 7500, 11020, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0005';

INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Expansion joint repair levels 3-5', 'Levels 3-5', '2024-12-14',
  '[{"trade": "Cement Mason", "workers": 3, "hours": 12, "rate": 72}]'::jsonb, 2592,
  '[{"item": "Joint sealant", "quantity": 100, "unit": "lf", "unit_cost": 28}]'::jsonb, 2800, 5392, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0005';

INSERT INTO tickets (project_id, description, location, work_date, labor, labor_total, materials, materials_total, total_amount, status) 
SELECT p.id, 'Stairwell lighting replacement', 'All Stairwells', '2024-12-13',
  '[{"trade": "Electrician", "workers": 2, "hours": 16, "rate": 88}]'::jsonb, 2816,
  '[{"item": "Emergency fixtures", "quantity": 48, "unit": "ea", "unit_cost": 125}]'::jsonb, 6000, 8816, 'pending_review'
FROM projects p WHERE p.project_code = 'PRJ-25-0005';

-- ============================================================================
-- CHANGE ORDERS
-- ============================================================================

INSERT INTO change_orders (project_id, title, description, status, original_amount, current_amount, change_reason)
SELECT p.id, 'Structural Steel Modifications', 'Additional steel reinforcement per structural engineer RFI response', 'approved', 45000, 52000, 'rfi_response'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO change_orders (project_id, title, description, status, original_amount, current_amount, change_reason)
SELECT p.id, 'MEP Coordination Changes', 'HVAC and electrical rerouting due to design conflicts', 'approved', 28000, 31500, 'design_change'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO change_orders (project_id, title, description, status, original_amount, current_amount, change_reason)
SELECT p.id, 'Owner Suite Upgrades Floor 25', 'Premium finishes and additional electrical per owner', 'submitted', 85000, 85000, 'owner_request'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO change_orders (project_id, title, description, status, original_amount, current_amount, change_reason)
SELECT p.id, 'Unforeseen Foundation Conditions', 'Additional excavation and soil stabilization', 'approved', 125000, 142000, 'field_condition'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO change_orders (project_id, title, description, status, original_amount, current_amount, change_reason)
SELECT p.id, 'Medical Gas System Expansion', 'Additional med gas outlets per facility requirements', 'approved', 68000, 72000, 'owner_request'
FROM projects p WHERE p.project_code = 'PRJ-25-0002';

INSERT INTO change_orders (project_id, title, description, status, original_amount, current_amount, change_reason)
SELECT p.id, 'Radiation Shielding Upgrades', 'Enhanced lead lining for imaging rooms', 'approved', 95000, 98500, 'code_requirement'
FROM projects p WHERE p.project_code = 'PRJ-25-0002';

INSERT INTO change_orders (project_id, title, description, status, original_amount, current_amount, change_reason)
SELECT p.id, 'Emergency Power Redundancy', 'Additional generator capacity per code update', 'submitted', 156000, 156000, 'code_requirement'
FROM projects p WHERE p.project_code = 'PRJ-25-0002';

INSERT INTO change_orders (project_id, title, description, status, original_amount, current_amount, change_reason)
SELECT p.id, 'Premium Unit Upgrades', 'Upgraded finishes for penthouses', 'approved', 180000, 195000, 'owner_request'
FROM projects p WHERE p.project_code = 'PRJ-25-0003';

INSERT INTO change_orders (project_id, title, description, status, original_amount, current_amount, change_reason)
SELECT p.id, 'EV Charging Expansion', 'Additional 50 EV charging stations', 'approved', 125000, 125000, 'owner_request'
FROM projects p WHERE p.project_code = 'PRJ-25-0005';

-- ============================================================================
-- DAILY LOGS (30 days of logs for active projects)
-- ============================================================================

-- Metro Center Tower daily logs
INSERT INTO daily_logs (project_id, log_date, weather_condition, temperature_high, temperature_low, weather_delay_hours, site_conditions, work_performed, work_planned_tomorrow, delays, total_workers, total_hours, status)
SELECT p.id, '2024-12-15', 'clear', 72, 55, 0, 'Dry, good conditions', 'Continued steel erection floors 35-38. MEP rough-in floors 20-25. Curtain wall installation floors 15-20.', 'Continue steel erection. Start concrete pour floor 34.', NULL, 145, 1160, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO daily_logs (project_id, log_date, weather_condition, temperature_high, temperature_low, weather_delay_hours, site_conditions, work_performed, work_planned_tomorrow, delays, total_workers, total_hours, status)
SELECT p.id, '2024-12-14', 'partly_cloudy', 68, 52, 0, 'Dry', 'Steel erection floors 34-37. Electrical rough-in floors 18-22. Drywall floors 10-15.', 'Continue all trades. Crane inspection scheduled.', NULL, 152, 1216, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO daily_logs (project_id, log_date, weather_condition, temperature_high, temperature_low, weather_delay_hours, site_conditions, work_performed, work_planned_tomorrow, delays, total_workers, total_hours, status)
SELECT p.id, '2024-12-13', 'rain', 65, 50, 2.5, 'Wet conditions, standing water', 'Interior work continued. Steel erection suspended due to rain. MEP work floors 15-20.', 'Resume steel if weather permits. Continue interior.', 'Rain delay - 2.5 hours lost on exterior work', 118, 885, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO daily_logs (project_id, log_date, weather_condition, temperature_high, temperature_low, weather_delay_hours, site_conditions, work_performed, work_planned_tomorrow, delays, total_workers, total_hours, status)
SELECT p.id, '2024-12-12', 'clear', 70, 48, 0, 'Dry, slight wind', 'Concrete pour floor 33 completed. Steel erection floors 33-36. Curtain wall floors 12-15.', 'Steel erection continue. Start waterproofing level 10.', NULL, 165, 1320, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO daily_logs (project_id, log_date, weather_condition, temperature_high, temperature_low, weather_delay_hours, site_conditions, work_performed, work_planned_tomorrow, delays, total_workers, total_hours, status)
SELECT p.id, '2024-12-11', 'clear', 74, 52, 0, 'Excellent conditions', 'Full production day. All trades working. Concrete prep floor 33. Steel floors 32-35.', 'Concrete pour floor 33 at 6AM.', NULL, 178, 1424, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

-- Harbor View Medical daily logs
INSERT INTO daily_logs (project_id, log_date, weather_condition, temperature_high, temperature_low, weather_delay_hours, site_conditions, work_performed, work_planned_tomorrow, delays, total_workers, total_hours, status)
SELECT p.id, '2024-12-15', 'clear', 75, 58, 0, 'Dry', 'Wing B structural steel complete. MEP overhead Wing A floors 2-3. Lead abatement Wing A basement ongoing.', 'Continue MEP. Start drywall Wing B floor 1.', NULL, 198, 1584, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0002';

INSERT INTO daily_logs (project_id, log_date, weather_condition, temperature_high, temperature_low, weather_delay_hours, site_conditions, work_performed, work_planned_tomorrow, delays, total_workers, total_hours, status)
SELECT p.id, '2024-12-14', 'partly_cloudy', 72, 55, 0, 'Good', 'Steel erection Wing B floors 3-4. Radiation shielding Wing C floor 1. Underground utilities Wing C.', 'Complete steel Wing B. Continue shielding.', NULL, 185, 1480, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0002';

INSERT INTO daily_logs (project_id, log_date, weather_condition, temperature_high, temperature_low, weather_delay_hours, site_conditions, work_performed, work_planned_tomorrow, delays, total_workers, total_hours, status)
SELECT p.id, '2024-12-13', 'cloudy', 68, 54, 0, 'Overcast but dry', 'Foundation work Wing C complete. Steel delivery and staging. Interior demo Wing A.', 'Start steel erection Wing C.', 'Material delivery delayed 2 hours', 175, 1400, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0002';

-- Riverside Apartments daily logs
INSERT INTO daily_logs (project_id, log_date, weather_condition, temperature_high, temperature_low, weather_delay_hours, site_conditions, work_performed, work_planned_tomorrow, delays, total_workers, total_hours, status)
SELECT p.id, '2024-12-15', 'clear', 78, 60, 0, 'Dry', 'Framing Building C floors 2-3. Roofing Building A. MEP rough Building B.', 'Continue framing. Start siding Building A.', NULL, 92, 736, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0003';

INSERT INTO daily_logs (project_id, log_date, weather_condition, temperature_high, temperature_low, weather_delay_hours, site_conditions, work_performed, work_planned_tomorrow, delays, total_workers, total_hours, status)
SELECT p.id, '2024-12-14', 'clear', 76, 58, 0, 'Good', 'Framing Building C floor 1 complete. Plumbing rough Building B. Pool excavation.', 'Continue framing floors 2-3.', NULL, 88, 704, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0003';

-- Downtown Parking daily logs
INSERT INTO daily_logs (project_id, log_date, weather_condition, temperature_high, temperature_low, weather_delay_hours, site_conditions, work_performed, work_planned_tomorrow, delays, total_workers, total_hours, status)
SELECT p.id, '2024-12-15', 'clear', 70, 52, 0, 'Dry', 'Concrete pour level 6. Post-tension stressing level 5. MEP rough levels 2-3.', 'Form level 7. Continue MEP.', NULL, 65, 520, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0005';

INSERT INTO daily_logs (project_id, log_date, weather_condition, temperature_high, temperature_low, weather_delay_hours, site_conditions, work_performed, work_planned_tomorrow, delays, total_workers, total_hours, status)
SELECT p.id, '2024-12-14', 'partly_cloudy', 68, 50, 0, 'Good', 'Formwork level 6. Rebar placement level 6. Electrical rough levels 1-2.', 'Concrete pour level 6.', NULL, 58, 464, 'approved'
FROM projects p WHERE p.project_code = 'PRJ-25-0005';

-- ============================================================================
-- DAILY LOG LABOR ENTRIES
-- ============================================================================

-- Get the daily log IDs and insert labor entries
INSERT INTO daily_log_labor (daily_log_id, trade, worker_count, regular_hours, overtime_hours, work_description)
SELECT dl.id, 'Ironworker', 24, 8, 2, 'Steel erection floors 35-38'
FROM daily_logs dl JOIN projects p ON dl.project_id = p.id 
WHERE p.project_code = 'PRJ-25-0001' AND dl.log_date = '2024-12-15';

INSERT INTO daily_log_labor (daily_log_id, trade, worker_count, regular_hours, overtime_hours, work_description)
SELECT dl.id, 'Electrician', 18, 8, 0, 'Rough-in floors 20-25'
FROM daily_logs dl JOIN projects p ON dl.project_id = p.id 
WHERE p.project_code = 'PRJ-25-0001' AND dl.log_date = '2024-12-15';

INSERT INTO daily_log_labor (daily_log_id, trade, worker_count, regular_hours, overtime_hours, work_description)
SELECT dl.id, 'Plumber', 12, 8, 0, 'Rough-in floors 20-25'
FROM daily_logs dl JOIN projects p ON dl.project_id = p.id 
WHERE p.project_code = 'PRJ-25-0001' AND dl.log_date = '2024-12-15';

INSERT INTO daily_log_labor (daily_log_id, trade, worker_count, regular_hours, overtime_hours, work_description)
SELECT dl.id, 'Sheet Metal Worker', 14, 8, 0, 'HVAC ductwork floors 18-22'
FROM daily_logs dl JOIN projects p ON dl.project_id = p.id 
WHERE p.project_code = 'PRJ-25-0001' AND dl.log_date = '2024-12-15';

INSERT INTO daily_log_labor (daily_log_id, trade, worker_count, regular_hours, overtime_hours, work_description)
SELECT dl.id, 'Glazier', 16, 8, 0, 'Curtain wall installation floors 15-20'
FROM daily_logs dl JOIN projects p ON dl.project_code = 'PRJ-25-0001' AND dl.log_date = '2024-12-15';

INSERT INTO daily_log_labor (daily_log_id, trade, worker_count, regular_hours, overtime_hours, work_description)
SELECT dl.id, 'Carpenter', 22, 8, 0, 'Interior framing and drywall'
FROM daily_logs dl JOIN projects p ON dl.project_id = p.id 
WHERE p.project_code = 'PRJ-25-0001' AND dl.log_date = '2024-12-15';

INSERT INTO daily_log_labor (daily_log_id, trade, worker_count, regular_hours, overtime_hours, work_description)
SELECT dl.id, 'Laborer', 28, 8, 0, 'General support and cleanup'
FROM daily_logs dl JOIN projects p ON dl.project_id = p.id 
WHERE p.project_code = 'PRJ-25-0001' AND dl.log_date = '2024-12-15';

INSERT INTO daily_log_labor (daily_log_id, trade, worker_count, regular_hours, overtime_hours, work_description)
SELECT dl.id, 'Cement Mason', 8, 8, 0, 'Floor finishing'
FROM daily_logs dl JOIN projects p ON dl.project_id = p.id 
WHERE p.project_code = 'PRJ-25-0001' AND dl.log_date = '2024-12-15';

-- Harbor View Medical labor
INSERT INTO daily_log_labor (daily_log_id, trade, worker_count, regular_hours, overtime_hours, work_description)
SELECT dl.id, 'Ironworker', 28, 8, 0, 'Structural steel Wing B'
FROM daily_logs dl JOIN projects p ON dl.project_id = p.id 
WHERE p.project_code = 'PRJ-25-0002' AND dl.log_date = '2024-12-15';

INSERT INTO daily_log_labor (daily_log_id, trade, worker_count, regular_hours, overtime_hours, work_description)
SELECT dl.id, 'Pipefitter', 22, 8, 2, 'Medical gas and plumbing'
FROM daily_logs dl JOIN projects p ON dl.project_id = p.id 
WHERE p.project_code = 'PRJ-25-0002' AND dl.log_date = '2024-12-15';

INSERT INTO daily_log_labor (daily_log_id, trade, worker_count, regular_hours, overtime_hours, work_description)
SELECT dl.id, 'Electrician', 24, 8, 0, 'Power and low voltage'
FROM daily_logs dl JOIN projects p ON dl.project_id = p.id 
WHERE p.project_code = 'PRJ-25-0002' AND dl.log_date = '2024-12-15';

INSERT INTO daily_log_labor (daily_log_id, trade, worker_count, regular_hours, overtime_hours, work_description)
SELECT dl.id, 'Laborer', 18, 8, 0, 'Lead abatement support'
FROM daily_logs dl JOIN projects p ON dl.project_id = p.id 
WHERE p.project_code = 'PRJ-25-0002' AND dl.log_date = '2024-12-15';

-- ============================================================================
-- RFIs
-- ============================================================================

INSERT INTO rfis (project_id, title, question, suggestion, drawing_number, spec_section, location, priority, status, has_cost_impact, estimated_cost_impact, has_schedule_impact, estimated_schedule_impact)
SELECT p.id, 'Steel Connection Detail Clarification', 'Drawing S-401 shows moment connection at grid B-7, but S-402 shows shear connection at same location. Please clarify which is correct.', 'Recommend moment connection per structural load requirements.', 'S-401, S-402', '05 12 00', 'Grid B-7, Floor 28', 'high', 'responded', true, 15000, true, 3
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO rfis (project_id, title, question, suggestion, drawing_number, spec_section, location, priority, status, has_cost_impact, estimated_cost_impact, has_schedule_impact, estimated_schedule_impact, response)
SELECT p.id, 'Curtain Wall Anchor Spacing', 'Spec calls for 24" anchor spacing but manufacturer recommends 18" for wind load. Which should we follow?', 'Recommend 18" spacing for safety factor.', 'A-301', '08 44 00', 'Floors 15-42, All Elevations', 'urgent', 'closed', true, 28000, false, 0, 'Use 18 inch spacing per manufacturer recommendation. Submit revised shop drawings.'
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO rfis (project_id, title, question, suggestion, drawing_number, spec_section, location, priority, status, has_cost_impact, estimated_cost_impact, has_schedule_impact, estimated_schedule_impact)
SELECT p.id, 'Elevator Pit Waterproofing', 'Groundwater encountered at elevator pit. Drawings do not show waterproofing system. Please advise.', 'Recommend bentonite waterproofing system with sump pump.', 'S-001', '07 10 00', 'Elevator Pit E-1', 'urgent', 'submitted', true, 45000, true, 5
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO rfis (project_id, title, question, suggestion, drawing_number, spec_section, location, priority, status, has_cost_impact, estimated_cost_impact, has_schedule_impact, estimated_schedule_impact)
SELECT p.id, 'Fire Damper Locations', 'MEP drawings conflict with architectural reflected ceiling plan at corridor intersections floors 10-15.', NULL, 'M-201, A-210', '23 33 00', 'Floors 10-15 Corridors', 'normal', 'under_review', false, 0, true, 2
FROM projects p WHERE p.project_code = 'PRJ-25-0001';

INSERT INTO rfis (project_id, title, question, suggestion, drawing_number, spec_section, location, priority, status, has_cost_impact, estimated_cost_impact, has_schedule_impact, estimated_schedule_impact, response)
SELECT p.id, 'Medical Gas Outlet Heights', 'Standard shows outlets at 60" AFF but equipment requires 48" AFF. Please confirm required height.', 'Recommend 48" per equipment specs.', 'M-501', '22 63 00', 'Wing B Patient Rooms', 'high', 'closed', false, 0, false, 0, 'Confirm 48 inch AFF for all patient room medical gas outlets. Update drawings accordingly.'
FROM projects p WHERE p.project_code = 'PRJ-25-0002';

INSERT INTO rfis (project_id, title, question, suggestion, drawing_number, spec_section, location, priority, status, has_cost_impact, estimated_cost_impact, has_schedule_impact, estimated_schedule_impact)
SELECT p.id, 'Lead Paint Encapsulation vs Removal', 'Existing Wing A has lead paint. Spec unclear on encapsulation vs full removal. Please clarify scope.', 'Full removal recommended for healthcare facility.', 'HAZ-001', '02 83 00', 'Wing A All Floors', 'urgent', 'responded', true, 125000, true, 10
FROM projects p WHERE p.project_code = 'PRJ-25-0002';

INSERT INTO rfis (project_id, title, question, suggestion, drawing_number, spec_section, location, priority, status, has_cost_impact, estimated_cost_impact, has_schedule_impact, estimated_schedule_impact)
SELECT p.id, 'Imaging Room Shielding Thickness', 'CT scanner model changed. New model requires additional lead thickness. Please provide updated requirements.', NULL, 'A-105', '13 49 00', 'Wing C Floor 1 Imaging', 'high', 'submitted', true, 35000, true, 4
FROM projects p WHERE p.project_code = 'PRJ-25-0002';

INSERT INTO rfis (project_id, title, question, suggestion, drawing_number, spec_section, location, priority, status, has_cost_impact, estimated_cost_impact, has_schedule_impact, estimated_schedule_impact)
SELECT p.id, 'Balcony Railing Height Code', 'Local code requires 42" guard height but drawings show 36". Please confirm required height.', '42" height required per IBC.', 'A-401', '05 52 00', 'All Balconies', 'high', 'responded', true, 18000, false, 0
FROM projects p WHERE p.project_code = 'PRJ-25-0003';

INSERT INTO rfis (project_id, title, question, suggestion, drawing_number, spec_section, location, priority, status, has_cost_impact, estimated_cost_impact, has_schedule_impact, estimated_schedule_impact)
SELECT p.id, 'Pool Equipment Room Ventilation', 'Mechanical drawings do not show ventilation for pool equipment room. Chemical storage requires specific CFM.', 'Add exhaust fan minimum 500 CFM.', 'M-101', '23 34 00', 'Amenity Building', 'normal', 'submitted', true, 8500, true, 2
FROM projects p WHERE p.project_code = 'PRJ-25-0003';

INSERT INTO rfis (project_id, title, question, suggestion, drawing_number, spec_section, location, priority, status, has_cost_impact, estimated_cost_impact, has_schedule_impact, estimated_schedule_impact, response)
SELECT p.id, 'EV Charger Circuit Requirements', 'Electrical drawings show 40A circuits but specified chargers require 50A. Please confirm circuit size.', '50A circuits required per manufacturer.', 'E-201', '26 27 00', 'Levels 1-4', 'high', 'closed', true, 22000, false, 0, 'Revise to 50A circuits for all EV charging stations. Issue revised electrical drawings.'
FROM projects p WHERE p.project_code = 'PRJ-25-0005';

-- ============================================================================
-- COST CODES (Sample global codes)
-- ============================================================================

INSERT INTO cost_codes (code, name, description, cost_type, is_global, status) VALUES
('03 30 00', 'Cast-in-Place Concrete', 'Concrete formwork, reinforcement, and placement', 'material', true, 'active'),
('05 12 00', 'Structural Steel Framing', 'Structural steel columns, beams, and connections', 'material', true, 'active'),
('07 10 00', 'Dampproofing and Waterproofing', 'Below-grade waterproofing systems', 'material', true, 'active'),
('08 44 00', 'Curtain Wall and Glazing', 'Aluminum curtain wall systems', 'material', true, 'active'),
('09 29 00', 'Gypsum Board', 'Drywall and finishing', 'material', true, 'active'),
('22 00 00', 'Plumbing', 'Plumbing systems and fixtures', 'labor', true, 'active'),
('23 00 00', 'HVAC', 'Heating, ventilation, and air conditioning', 'labor', true, 'active'),
('26 00 00', 'Electrical', 'Electrical systems and equipment', 'labor', true, 'active'),
('31 00 00', 'Earthwork', 'Excavation and grading', 'labor', true, 'active'),
('32 12 00', 'Asphalt Paving', 'Asphalt pavement and repairs', 'material', true, 'active');

-- Done!
SELECT 'Seed data inserted successfully!' as status;
