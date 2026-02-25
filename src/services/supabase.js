import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fyudtgircmyzzqkijfca.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dWR0Z2lyY215enpxa2lqZmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1Nzg1NTAsImV4cCI6MjA3OTE1NDU1MH0.l4irhwllayfqdz49rq-4Q4a6U7lijJE_vxs_Lk1tS1c';

export const supabase = createClient(supabaseUrl, supabaseKey);