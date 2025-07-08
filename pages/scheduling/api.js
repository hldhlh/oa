// pages/scheduling/api.js
// This module will encapsulate all interactions with the Supabase API. 

const SUPABASE_URL = 'https://qdcdhxlguuoksfhelywt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkY2RoeGxndXVva3NmaGVseXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDUxOTksImV4cCI6MjA2NzIyMTE5OX0.Cbb0JU__rDuKiAL0lwqwqCxok-HfilpIz8LOl9jP9iM';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
        console.error("Error getting user:", error);
        return null;
    }
    return user;
}

export async function getTeams() {
    const { data: teams, error } = await supabase.rpc('get_user_teams_with_members');
    if (error || !teams) {
        console.error('获取团队列表失败', error);
        return [];
    }
    return teams;
}

export async function getSchedules(teamId) {
    const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('team_id', teamId);
    if (error) {
        console.error('获取团队排班失败', error);
        return [];
    }
    return data;
}

export async function createSchedule(newItem) {
    console.log('[API] 创建新排班项目:', newItem);
    const { data, error } = await supabase
        .from('schedules')
        .insert(newItem);
    
    if (error) {
        console.error('创建排班项目失败:', error);
        return null;
    }
    
    // 如果插入成功但没有返回数据，手动获取刚创建的记录
    if (!data || data.length === 0) {
        console.log('[API] 插入成功但未返回数据，尝试获取刚创建的记录');
        // 使用创建时间和用户ID查询最新创建的记录
        const { data: fetchedData, error: fetchError } = await supabase
            .from('schedules')
            .select('*')
            .eq('user_id', newItem.user_id)
            .eq('team_id', newItem.team_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
        if (fetchError) {
            console.error('获取新创建的排班项目失败:', fetchError);
            return newItem; // 至少返回原始数据
        }
        
        console.log('[API] 成功获取新创建的记录:', fetchedData);
        return fetchedData;
    }
    
    console.log('[API] 创建成功, 返回数据:', data);
    return Array.isArray(data) ? data[0] : data;
}

export async function createBulkSchedules(newItems) {
    if (!newItems || newItems.length === 0) return [];
    
    console.log(`[API] 批量创建 ${newItems.length} 个新排班项目.`);
    const { data, error } = await supabase
        .from('schedules')
        .insert(newItems);
        
    if (error) {
        console.error('批量创建排班项目失败:', error);
        return null;
    }
    
    // 如果插入成功但没有返回数据，手动获取刚创建的记录
    if (!data || data.length === 0) {
        console.log('[API] 批量插入成功但未返回数据，尝试获取刚创建的记录');
        
        // 使用第一条记录的团队ID和用户ID查询最新创建的记录
        const teamId = newItems[0].team_id;
        const userIds = newItems.map(item => item.user_id);
        
        // 查询最近创建的与批量创建匹配的记录
        const { data: fetchedData, error: fetchError } = await supabase
            .from('schedules')
            .select('*')
            .eq('team_id', teamId)
            .in('user_id', userIds)
            .order('created_at', { ascending: false })
            .limit(newItems.length);
            
        if (fetchError) {
            console.error('获取新创建的排班项目失败:', fetchError);
            return newItems; // 至少返回原始数据
        }
        
        console.log(`[API] 成功获取 ${fetchedData.length} 条新创建的记录`);
        return fetchedData;
    }
    
    console.log('[API] 批量创建成功, 返回数据:', data);
    return data;
}

export async function updateScheduleTask(id, newTask) {
    const { data, error } = await supabase
        .from('schedules')
        .update({ task_description: newTask })
        .eq('id', id);
        
    if (error) {
        console.error(`更新任务描述失败 (ID: ${id}):`, error);
        return null;
    }
    
    // 如果更新成功但没有返回数据，手动获取更新后的记录
    if (!data || data.length === 0) {
        const { data: fetchedData, error: fetchError } = await supabase
            .from('schedules')
            .select('*')
            .eq('id', id)
            .single();
            
        if (fetchError) {
            console.error(`获取更新后的排班项目失败 (ID: ${id}):`, fetchError);
            return { id, task_description: newTask }; // 至少返回更新的字段
        }
        
        return fetchedData;
    }
    
    return Array.isArray(data) ? data[0] : data;
}

export async function deleteSchedule(itemId) {
    console.log(`[API] 准备删除排班项目, ID: ${itemId}`);
    
    try {
        // 使用RPC函数删除排班项目
        const { data, error } = await supabase.rpc('delete_schedule_safely', {
            schedule_id: itemId
        });
        
        if (error) {
            console.error(`[API] RPC删除失败, ID: ${itemId}, 错误:`, error.message);
            throw new Error(`删除排班项目失败: ${error.message}`);
        }
        
        console.log(`[API] RPC删除结果:`, data);
        
        if (data && data.success) {
            return { 
                success: true, 
                method: 'hard_delete',
                data: data.data ? [data.data] : []
            };
        } else {
            throw new Error(data?.message || '删除操作未返回成功状态');
        }
    } catch (e) {
        console.error(`[API] 删除尝试失败, ID: ${itemId}, 错误:`, e.message || e);
        
        // 如果RPC调用失败，尝试使用任务描述标记删除的备用方案
        try {
            console.warn(`[API] 尝试备用方案：更新任务描述, ID: ${itemId}`);
            const now = new Date().toISOString();
            const { data: updatedData, error: updateError } = await supabase
                .from('schedules')
                .update({ 
                    task_description: `[已删除] ${now}`
                })
                .eq('id', itemId)
                .select();
            
            if (updateError) {
                console.error(`[API] 备用方案失败, ID: ${itemId}, 错误:`, updateError.message);
                throw e; // 抛出原始错误
            }
            
            console.log(`[API] 通过更新任务描述成功标记为删除, ID: ${itemId}`);
            return { success: true, method: 'mark_as_deleted', data: updatedData };
        } catch (backupError) {
            console.error(`[API] 备用方案也失败, ID: ${itemId}, 错误:`, backupError.message || backupError);
            throw e; // 抛出原始错误
        }
    }
}

export async function updateScheduleTime(id, newStartTime, newEndTime, newOwnerId) {
    console.log(`[API] 更新排班时间, ID: ${id}, 开始: ${newStartTime}, 结束: ${newEndTime}, 新所有者: ${newOwnerId || '无变化'}`);
    
    try {
        // 使用RPC函数更新排班时间
        const { data, error } = await supabase.rpc('update_schedule_time_safely', {
            schedule_id: id,
            new_start_time: newStartTime,
            new_end_time: newEndTime,
            new_owner_id: newOwnerId
        });
        
        if (error) {
            console.error(`[API] RPC更新失败, ID: ${id}, 错误:`, error.message);
            throw new Error(`更新排班时间失败: ${error.message}`);
        }
        
        console.log(`[API] RPC更新结果:`, data);
        
        if (data && data.success) {
            return data.data;
        } else {
            throw new Error(data?.message || '更新操作未返回成功状态');
        }
    } catch (e) {
        console.error(`[API] 更新排班时间失败, ID: ${id}, 错误:`, e.message || e);
        return null;
    }
}

// --- NEW REALTIME SUBSCRIPTION ---

let realtimeChannel = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3秒

export function subscribeToScheduleChanges(teamId, dataCallback, statusCallback) {
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
        console.log('[Realtime] 移除现有通道。');
    }

    if (!teamId) {
        console.log('[Realtime] 未选择团队，停止订阅。');
        if (statusCallback) statusCallback('closed');
        return;
    }
    
    console.log(`[Realtime] 订阅团队ID为${teamId}的排班变更`);
    if (statusCallback) statusCallback('connecting');

    // 重置重连尝试次数
    reconnectAttempts = 0;
    
    // 创建并订阅通道
    subscribeToChannel(teamId, dataCallback, statusCallback);
    
    return realtimeChannel;
}

function subscribeToChannel(teamId, dataCallback, statusCallback) {
    realtimeChannel = supabase
        .channel(`public:schedules:team_id=eq.${teamId}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'schedules', filter: `team_id=eq.${teamId}` },
            (payload) => {
                console.log('[Realtime] 收到变更!', payload);
                dataCallback(payload);
            }
        )
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log(`[Realtime] 成功订阅团队${teamId}!`);
                if (statusCallback) statusCallback('subscribed');
                // 重置重连尝试次数
                reconnectAttempts = 0;
            }
            if (status === 'CHANNEL_ERROR') {
                console.error('[Realtime] 订阅错误:', err);
                if (statusCallback) statusCallback('error');
                handleReconnect(teamId, dataCallback, statusCallback);
            }
            if (status === 'TIMED_OUT') {
                console.warn('[Realtime] 订阅超时。');
                if (statusCallback) statusCallback('error');
                handleReconnect(teamId, dataCallback, statusCallback);
            }
            if (status === 'CLOSED') {
                console.log('[Realtime] 订阅已关闭。');
                if (statusCallback) statusCallback('closed');
            }
        });
}

function handleReconnect(teamId, dataCallback, statusCallback) {
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`[Realtime] 尝试重新连接 (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        if (statusCallback) statusCallback('reconnecting');
        
        setTimeout(() => {
            if (realtimeChannel) {
                supabase.removeChannel(realtimeChannel);
                realtimeChannel = null;
            }
            subscribeToChannel(teamId, dataCallback, statusCallback);
        }, RECONNECT_DELAY);
    } else {
        console.error(`[Realtime] 达到最大重连尝试次数 (${MAX_RECONNECT_ATTEMPTS})，停止重连。`);
        if (statusCallback) statusCallback('error');
    }
}

export function unsubscribe() {
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
        console.log('[Realtime] 已取消订阅通道。');
    }
} 