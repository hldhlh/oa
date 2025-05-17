// 这个页面代码不许修改只需直接调用export const supabase = createClient(supabaseUrl, supabaseKey) 
// 使用 CDN 引入 Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm'

// 初始化 Supabase 客户端
const supabaseUrl = 'https://ainzxxuoweieowjyalgf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpbnp4eHVvd2VpZW93anlhbGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3Njc0ODYsImV4cCI6MjA2MTM0MzQ4Nn0.FLndEbZjMTXEAwyBpzMxgzOh-t3DAfELIn6GthcBJ8s'

export const supabase = createClient(supabaseUrl, supabaseKey) 