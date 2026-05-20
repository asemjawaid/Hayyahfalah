-- ── profiles ────────────────────────────────────────────────────────────────
-- Public lookup table for users — enables family linking by email or profile code

CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  display_name TEXT,
  profile_code TEXT UNIQUE NOT NULL,  -- first 8 hex chars of UUID, upper-case
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone signed in can look up a profile (needed for family linking)
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only the user themselves can insert/update their own row
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── family_links ─────────────────────────────────────────────────────────────
-- Records each family-member entry that has an email or confirmed user link

CREATE TABLE IF NOT EXISTS public.family_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_local_id TEXT NOT NULL,          -- Dexie UUID on owner's device
  member_name     TEXT NOT NULL,
  member_email    TEXT,                   -- email entered by owner for linking
  linked_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- confirmed once they sign in
  status          TEXT NOT NULL DEFAULT 'local'
                  CHECK (status IN ('local', 'pending', 'linked')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, member_local_id)
);

ALTER TABLE public.family_links ENABLE ROW LEVEL SECURITY;

-- Owner can manage all their links
CREATE POLICY "family_links_owner" ON public.family_links
  FOR ALL USING (auth.uid() = owner_id);

-- The linked user can see (but not modify) entries pointing at them
CREATE POLICY "family_links_linked_select" ON public.family_links
  FOR SELECT USING (auth.uid() = linked_user_id);
