-- Fix: Drop old case-sensitive constraint and re-add case-insensitive one
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (UPPER(role) IN ('ADMIN', 'MEMBER'));

-- Update any existing lowercase roles
UPDATE users SET role = UPPER(role) WHERE role != UPPER(role);
