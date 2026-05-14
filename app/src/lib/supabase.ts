import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://mqznowmensdsrtltqjmn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xem5vd21lbnNkc3J0bHRxam1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NzMyMTgsImV4cCI6MjA5NDM0OTIxOH0.5sin5KdiauLJcE4iqIVxurl5-TglLZiGgC71IPk0VZs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)