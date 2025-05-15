import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// 从用户提供的信息中获取 Supabase URL 和 anon key
const supabaseUrl = 'https://ainzxxuoweieowjyalgf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbnp4eHVvd2VpZW93anlhbGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3Njc0ODYsImV4cCI6MjA2MTM0MzQ4Nn0.FLndEbZjMTXEAwyBpzMxgzOh-t3DAfELIn6GthcBJ8s';

// 创建并导出 Supabase 客户端实例
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 