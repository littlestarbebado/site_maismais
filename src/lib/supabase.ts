import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { getSupabaseCredentials } from './supabase-config';

const credentials = getSupabaseCredentials();

export const supabaseClient = credentials
  ? createClient<Database>(credentials.url, credentials.anonKey)
  : null;
