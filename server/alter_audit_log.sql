-- מאפשר admin_id = NULL עבור אירועי מערכת (כגון ניסיון כניסה של משתמש חסום)
ALTER TABLE admin_audit_log MODIFY admin_id INT NULL;

-- אינדקס לשאילתות מהירות על חסימות
CREATE INDEX IF NOT EXISTS idx_audit_action_target ON admin_audit_log (action, target_id);
