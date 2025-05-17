// 使用 ESM CDN 导入 Supabase
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/+esm'

// 初始化 Supabase 客户端
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 员工数据相关操作
export async function getStaffData() {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('id')
    
    if (error) throw error
    
    // 转换数据格式以匹配原有的数据结构
    const staffData = {}
    const allStaffMembers = []
    
    data.forEach(staff => {
      staffData[staff.id] = {
        name: staff.name,
        role: staff.role,
        type: staff.type,
        role_text: `${staff.role}${staff.type}`,
        role_class: `${staff.role_class} ${staff.employment_type}`
      }
      
      allStaffMembers.push({
        id: staff.id,
        name: staff.name,
        role: staff.role,
        type: staff.type
      })
    })
    
    return { staffData, allStaffMembers }
  } catch (error) {
    console.error('获取员工数据失败:', error)
    throw error
  }
}

// 添加新员工
export async function addStaff(staffData) {
  try {
    const { data, error } = await supabase
      .from('staff')
      .insert([{
        id: staffData.id,
        name: staffData.name,
        role: staffData.role,
        type: staffData.type,
        role_class: staffData.role_class.split(' ')[0],
        employment_type: staffData.role_class.split(' ')[1]
      }])
      .select()
    
    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('添加员工失败:', error)
    throw error
  }
}

// 删除员工
export async function deleteStaff(staffId) {
  try {
    const { error } = await supabase
      .from('staff')
      .delete()
      .eq('id', staffId)
    
    if (error) throw error
  } catch (error) {
    console.error('删除员工失败:', error)
    throw error
  }
}

// 更新员工信息
export async function updateStaff(staffId, updates) {
  try {
    const { data, error } = await supabase
      .from('staff')
      .update(updates)
      .eq('id', staffId)
      .select()
    
    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('更新员工信息失败:', error)
    throw error
  }
} 