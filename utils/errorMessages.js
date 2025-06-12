// 错误消息映射
const errorMessages = {
    // 密码相关错误
    'Password should be at least 6 characters.': '密码长度至少需要6个字符。',
    'Password should be at least 8 characters.': '密码长度至少需要8个字符。',
    'Password should be at least 6 characters': '密码长度至少需要6个字符。',
    'Password should be at least 8 characters': '密码长度至少需要8个字符。',
    
    // 邮箱相关错误
    'Invalid email': '无效的邮箱地址',
    'Email not confirmed': '邮箱未验证',
    'Email already registered': '该邮箱已被注册',
    'Invalid login credentials': '邮箱或密码错误',
    
    // 用户相关错误
    'User already registered': '该用户已注册',
    'User not found': '用户不存在',
    
    // 通用错误
    'Server error': '服务器错误，请稍后重试',
    'Network error': '网络错误，请检查您的网络连接'
};

// 翻译错误消息
export function translateErrorMessage(message) {
    // 如果找到对应的翻译，返回翻译后的消息
    if (errorMessages[message]) {
        return errorMessages[message];
    }
    
    // 如果没有找到对应的翻译，返回原始消息
    return message;
}

// 导出错误消息映射
export default errorMessages; 