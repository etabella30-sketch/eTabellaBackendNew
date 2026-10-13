BEGIN;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT * FROM public."QfactExpressReadBackup" LOOP EXECUTE r."cDefinition"; END LOOP;
END $$;
DROP TABLE public."QfactExpressReadBackup";
COMMIT;
