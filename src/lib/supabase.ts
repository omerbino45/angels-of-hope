import { createClient } from '@supabase/supabase-js'

// The publishable key is meant to be public: the access rules in supabase/schema.sql decide what it may do.
const SUPABASE_URL = 'https://sbrhyxkvaqyofqsuvrya.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_W8UqvCFhIFka8iZC9pQ0jA_K1xzHjnZ'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
