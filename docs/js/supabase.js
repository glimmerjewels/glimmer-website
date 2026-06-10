const SUPABASE_URL = "https://bwgcnxaedxfoaoivfqlz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3Z2NueGFlZHhmb2FvaXZmcWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5MzY5ODksImV4cCI6MjA5MzUxMjk4OX0._ZfZdVWd1a_XqYKh1nWtdosc9PZQW85CSWkEpQmos38";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
