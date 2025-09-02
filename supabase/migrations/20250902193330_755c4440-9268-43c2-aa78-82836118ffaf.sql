-- Create unique constraint for driver_work_log to prevent duplicates
DROP INDEX IF EXISTS unique_driver_work_date;
CREATE UNIQUE INDEX unique_driver_work_date ON driver_work_log(employee_id, work_date);

-- Add constraint to ensure hours are not negative and not more than 24
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'driver_work_log_hours_check' 
        AND table_name = 'driver_work_log'
    ) THEN
        ALTER TABLE driver_work_log 
        ADD CONSTRAINT driver_work_log_hours_check 
        CHECK (hours >= 0 AND hours <= 24);
    END IF;
END $$;