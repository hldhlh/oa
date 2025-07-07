const SUPABASE_URL = 'https://qdcdhxlguuoksfhelywt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkY2RoeGxndXVva3NmaGVseXd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2NDUxOTksImV4cCI6MjA2NzIyMTE5OX0.Cbb0JU__rDuKiAL0lwqwqCxok-HfilpIz8LOl9jP9iM';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        alert('加载用户信息失败，请重新登录。');
        // 在实际应用中可能会重定向
        // window.top.location.href = '/'; 
        return;
    }
    currentUser = user;

    const emailDisplay = document.getElementById('email-display');
    const fullNameInput = document.getElementById('full-name-input');
    
    emailDisplay.value = user.email;
    fullNameInput.value = user.user_metadata?.full_name || '';

    const saveBtn = document.getElementById('save-profile-btn');
    saveBtn.addEventListener('click', handleSaveProfile);
});

async function handleSaveProfile() {
    const fullNameInput = document.getElementById('full-name-input');
    const saveBtn = document.getElementById('save-profile-btn');
    const newFullName = fullNameInput.value.trim();

    if (!newFullName) {
        parent.showMesg('姓名不能为空。', 'error');
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = '保存中...';

    const { data, error } = await supabase.auth.updateUser({
        data: { full_name: newFullName }
    });

    if (error) {
        parent.showMesg(`更新失败: ${error.message}`, 'error');
    } else {
        // 更新成功后，也更新 profiles 表以保持数据同步
        await supabase.from('profiles').upsert({
            id: currentUser.id,
            full_name: newFullName,
            updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
        
        // 通知父窗口更新用户信息显示
        if (parent && parent.updateUserInfoDisplay) {
            parent.updateUserInfoDisplay(newFullName);
        }

        parent.showMesg('个人信息更新成功！', 'success');
    }

    saveBtn.disabled = false;
    saveBtn.textContent = '保存更改';
} 