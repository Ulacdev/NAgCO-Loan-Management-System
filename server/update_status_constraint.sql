-- Update status constraint to include Pending and Rejected
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;
ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('Active', 'Inactive', 'Pending', 'Rejected'));

-- Set default status to Pending for future inserts if not specified
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'Pending';
