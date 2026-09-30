-- Intentionally no destructive rollback. These rows represent access that was
-- already granted through LocationShare; deleting them would make recipients
-- lose documents again. Reverting the application code is sufficient.
BEGIN;
COMMIT;
