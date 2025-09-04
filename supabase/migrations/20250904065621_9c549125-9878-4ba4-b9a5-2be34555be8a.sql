-- Add return_date column for vanlinijski rides
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS return_date DATE;

-- Create view for vehicle reminders dashboard
CREATE OR REPLACE VIEW public.v_vehicle_reminders_dashboard AS
SELECT 
    v.registration || ' - ' || 
    CASE 
        WHEN vd.registration_expiry IS NOT NULL AND vd.registration_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN 'Registracija'
        WHEN vd.technical_expiry IS NOT NULL AND vd.technical_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN 'Tehnički pregled'
        WHEN vd.technical_6m_expiry IS NOT NULL AND vd.technical_6m_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN 'Tehnički pregled (6m)'
        WHEN vd.tachograph_calibration_expiry IS NOT NULL AND vd.tachograph_calibration_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN 'Tahograf kalibracija'
        WHEN vd.fire_extinguisher_expiry IS NOT NULL AND vd.fire_extinguisher_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN 'PP aparat'
    END as reminder_type,
    CASE 
        WHEN vd.registration_expiry IS NOT NULL AND vd.registration_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN vd.registration_expiry
        WHEN vd.technical_expiry IS NOT NULL AND vd.technical_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN vd.technical_expiry
        WHEN vd.technical_6m_expiry IS NOT NULL AND vd.technical_6m_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN vd.technical_6m_expiry
        WHEN vd.tachograph_calibration_expiry IS NOT NULL AND vd.tachograph_calibration_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN vd.tachograph_calibration_expiry
        WHEN vd.fire_extinguisher_expiry IS NOT NULL AND vd.fire_extinguisher_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN vd.fire_extinguisher_expiry
    END as expiry_date,
    CASE 
        WHEN vd.registration_expiry IS NOT NULL AND vd.registration_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN vd.registration_expiry - CURRENT_DATE
        WHEN vd.technical_expiry IS NOT NULL AND vd.technical_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN vd.technical_expiry - CURRENT_DATE
        WHEN vd.technical_6m_expiry IS NOT NULL AND vd.technical_6m_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN vd.technical_6m_expiry - CURRENT_DATE
        WHEN vd.tachograph_calibration_expiry IS NOT NULL AND vd.tachograph_calibration_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN vd.tachograph_calibration_expiry - CURRENT_DATE
        WHEN vd.fire_extinguisher_expiry IS NOT NULL AND vd.fire_extinguisher_expiry <= CURRENT_DATE + INTERVAL '30 days' THEN vd.fire_extinguisher_expiry - CURRENT_DATE
    END as days_until_expiry,
    v.registration,
    v.id as vehicle_id
FROM public.vehicles v
LEFT JOIN public.vehicle_deadlines vd ON v.id = vd.vehicle_id
WHERE (
    (vd.registration_expiry IS NOT NULL AND vd.registration_expiry <= CURRENT_DATE + INTERVAL '30 days') OR
    (vd.technical_expiry IS NOT NULL AND vd.technical_expiry <= CURRENT_DATE + INTERVAL '30 days') OR
    (vd.technical_6m_expiry IS NOT NULL AND vd.technical_6m_expiry <= CURRENT_DATE + INTERVAL '30 days') OR
    (vd.tachograph_calibration_expiry IS NOT NULL AND vd.tachograph_calibration_expiry <= CURRENT_DATE + INTERVAL '30 days') OR
    (vd.fire_extinguisher_expiry IS NOT NULL AND vd.fire_extinguisher_expiry <= CURRENT_DATE + INTERVAL '30 days')
)
ORDER BY expiry_date ASC;