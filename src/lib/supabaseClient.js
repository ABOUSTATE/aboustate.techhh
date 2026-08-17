import { createClient } from "@supabase/supabase-js";

// Publishable/anon key — safe to expose in the browser. Every table it can
// touch is protected by Row Level Security (service_requests: users can only
// SELECT their own rows; INSERT/UPDATE only happens server-side via the
// service-role key in the API routes).
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
