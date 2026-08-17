create table service_requests (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('appointment', 'quotation')),
  name text not null,
  email text not null,
  phone text,
  project_description text,
  timeline text,
  is_student_project boolean not null default false,
  services text[] not null default '{}',
  other_service_description text,
  status text not null default 'New' check (status in ('New', 'Contacted', 'Won', 'Lost')),
  notes text not null default '',
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index service_requests_submitted_at_idx on service_requests (submitted_at desc);

-- Row Level Security: no public policies are defined below, so this table
-- is completely inaccessible via the anon/public API key. Only the
-- server-side service role key (used in the Vercel API route, never sent
-- to the browser) can read or write it. This is the correct posture since
-- all access goes through /api/request-service, not directly from the
-- client.
alter table service_requests enable row level security;
