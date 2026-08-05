-- ============================================================
-- Seed staff and student auth accounts for login verification
-- ============================================================

-- Disable the profile role guard temporarily so we can seed the role values safely.
alter table public.profiles disable trigger guard_profile_role;

DO $$
DECLARE
  v_admin_id uuid := 'ea54be9b-1229-442c-aa88-a5ff983b8b60';
  v_guru_id uuid := 'd5c06893-5d35-4681-b86f-2610c911e64a';
  v_osis_id uuid := '8fbe17ad-4d21-40e2-a79e-82fc0e302581';
  v_student_id uuid := 'da55f59e-1389-4a13-b19e-34c7e62f1a78';
BEGIN
  -- Admin account
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_admin_id) THEN
    INSERT INTO auth.users (id, email, password, email_verified, profile)
    VALUES (v_admin_id, 'admin.test@smkn11.sch.id', crypt('smkn11admin', gen_salt('bf', 10)), true, jsonb_build_object('name', 'Admin Test'));
  ELSE
    UPDATE auth.users
    SET email = 'admin.test@smkn11.sch.id',
        password = crypt('smkn11admin', gen_salt('bf', 10)),
        email_verified = true,
        profile = COALESCE(profile, '{}'::jsonb) || jsonb_build_object('name', 'Admin Test')
    WHERE id = v_admin_id;
  END IF;

  INSERT INTO public.profiles (id, role, name, email)
  VALUES (v_admin_id, 'admin', 'Admin Test', 'admin.test@smkn11.sch.id')
  ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      name = EXCLUDED.name,
      email = EXCLUDED.email;

  -- Guru account
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_guru_id) THEN
    INSERT INTO auth.users (id, email, password, email_verified, profile)
    VALUES (v_guru_id, 'guru.test@smkn11.sch.id', crypt('smkn11guru', gen_salt('bf', 10)), true, jsonb_build_object('name', 'Guru Test'));
  ELSE
    UPDATE auth.users
    SET email = 'guru.test@smkn11.sch.id',
        password = crypt('smkn11guru', gen_salt('bf', 10)),
        email_verified = true,
        profile = COALESCE(profile, '{}'::jsonb) || jsonb_build_object('name', 'Guru Test')
    WHERE id = v_guru_id;
  END IF;

  INSERT INTO public.profiles (id, role, name, email)
  VALUES (v_guru_id, 'guru', 'Guru Test', 'guru.test@smkn11.sch.id')
  ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      name = EXCLUDED.name,
      email = EXCLUDED.email;

  -- OSIS account
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_osis_id) THEN
    INSERT INTO auth.users (id, email, password, email_verified, profile)
    VALUES (v_osis_id, 'osis.test@smkn11.sch.id', crypt('smkn11osis', gen_salt('bf', 10)), true, jsonb_build_object('name', 'OSIS Test'));
  ELSE
    UPDATE auth.users
    SET email = 'osis.test@smkn11.sch.id',
        password = crypt('smkn11osis', gen_salt('bf', 10)),
        email_verified = true,
        profile = COALESCE(profile, '{}'::jsonb) || jsonb_build_object('name', 'OSIS Test')
    WHERE id = v_osis_id;
  END IF;

  INSERT INTO public.profiles (id, role, name, email)
  VALUES (v_osis_id, 'osis', 'OSIS Test', 'osis.test@smkn11.sch.id')
  ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      name = EXCLUDED.name,
      email = EXCLUDED.email;

  -- Student account
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_student_id) THEN
    INSERT INTO auth.users (id, email, password, email_verified, profile)
    VALUES (v_student_id, 'student.test@smkn11.sch.id', crypt('smkn11student', gen_salt('bf', 10)), true, jsonb_build_object('name', 'Student Test'));
  ELSE
    UPDATE auth.users
    SET email = 'student.test@smkn11.sch.id',
        password = crypt('smkn11student', gen_salt('bf', 10)),
        email_verified = true,
        profile = COALESCE(profile, '{}'::jsonb) || jsonb_build_object('name', 'Student Test')
    WHERE id = v_student_id;
  END IF;

  INSERT INTO public.profiles (id, role, name, email)
  VALUES (v_student_id, 'student', 'Student Test', 'student.test@smkn11.sch.id')
  ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      name = EXCLUDED.name,
      email = EXCLUDED.email;

  INSERT INTO public.students (id, nisn, name, class, major)
  VALUES (v_student_id, '1234567890', 'Student Test', 'XII TJKT 1', 'Teknik Jaringan')
  ON CONFLICT (id) DO UPDATE
  SET nisn = EXCLUDED.nisn,
      name = EXCLUDED.name,
      class = EXCLUDED.class,
      major = EXCLUDED.major;

  INSERT INTO public.student_accounts (id, student_id, email, status)
  VALUES (v_student_id, v_student_id, 'nisn-1234567890@mading.smkn11.sch.id', 'active')
  ON CONFLICT (id) DO UPDATE
  SET student_id = EXCLUDED.student_id,
      email = EXCLUDED.email,
      status = EXCLUDED.status;
END $$;

alter table public.profiles enable trigger guard_profile_role;

