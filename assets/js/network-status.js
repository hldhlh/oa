/**
 * 网络状态检测工具
 * 用于检测用户网络连接状态和Supabase服务可用性
 */

// 服务器URL列表
const serverUrls = [
    'https://qdcdhxlguuoksfhelywt.supabase.co',
    'https://qdcdhxlguuoksfhelywt.ap-northeast-1.supabase.co',
    'https://qdcdhxlguuoksfhelywt.ap-southeast-1.supabase.co'
];

// 检测网络连接状态
async function checkNetworkStatus() {
    // 检查基本网络连接
    if (!navigator.onLine) {
        return {
            online: false,
            message: '您当前处于离线状态，请检查网络连接。'
        };
    }
    
    // 检查Supabase服务可用性
    const results = await Promise.all(
        serverUrls.map(async (url) => {
            try {
                const startTime = Date.now();
                const response = await fetch(`${url}/rest/v1/`, {
                    method: 'HEAD',
                    headers: {
                        'apikey': supabaseKey
                    },
                    // 设置超时
                    signal: AbortSignal.timeout(3000)
                });
                const endTime = Date.now();
                const latency = endTime - startTime;
                
                return {
                    url,
                    available: response.ok,
                    latency,
                    status: response.status
                };
            } catch (error) {
                return {
                    url,
                    available: false,
                    error: error.message
                };
            }
        })
    );
    
    // 找出可用的服务器
    const availableServers = results.filter(r => r.available);
    
    if (availableServers.length > 0) {
        // 按延迟排序
        availableServers.sort((a, b) => a.latency - b.latency);
        const bestServer = availableServers[0];
        
        return {
            online: true,
            bestServer,
            allServers: results,
            message: `网络连接正常，最佳服务器: ${bestServer.url} (延迟: ${bestServer.latency}ms)`
        };
    } else {
        return {
            online: true,
            supabaseAvailable: false,
            allServers: results,
            message: '无法连接到Supabase服务，请联系管理员或稍后再试。'
        };
    }
}

// 显示网络状态
function showNetworkStatus() {
    const statusContainer = document.createElement('div');
    statusContainer.className = 'network-status';
    statusContainer.style.position = 'fixed';
    statusContainer.style.bottom = '10px';
    statusContainer.style.right = '10px';
    statusContainer.style.padding = '10px';
    statusContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    statusContainer.style.color = 'white';
    statusContainer.style.borderRadius = '5px';
    statusContainer.style.fontSize = '12px';
    statusContainer.style.zIndex = '9999';
    statusContainer.style.display = 'none';
    
    document.body.appendChild(statusContainer);
    
    return {
        update: async function() {
            const status = await checkNetworkStatus();
            
            if (status.online && (status.bestServer || !status.supabaseAvailable)) {
                statusContainer.style.display = 'block';
                
                if (status.bestServer) {
                    statusContainer.style.backgroundColor = 'rgba(0, 128, 0, 0.7)';
                    statusContainer.innerHTML = `
                        <div>✅ ${status.message}</div>
                    `;
                } else {
                    statusContainer.style.backgroundColor = 'rgba(255, 0, 0, 0.7)';
                    statusContainer.innerHTML = `
                        <div>❌ ${status.message}</div>
                        <div style="margin-top: 5px;">
                            <button id="network-retry" style="background: white; color: black; border: none; padding: 3px 8px; border-radius: 3px; cursor: pointer;">重试</button>
                            <button id="network-close" style="background: transparent; color: white; border: 1px solid white; padding: 3px 8px; border-radius: 3px; margin-left: 5px; cursor: pointer;">关闭</button>
                        </div>
                    `;
                    
                    document.getElementById('network-retry').addEventListener('click', () => {
                        this.update();
                    });
                    
                    document.getElementById('network-close').addEventListener('click', () => {
                        statusContainer.style.display = 'none';
                    });
                }
                
                // 5秒后自动隐藏
                setTimeout(() => {
                    statusContainer.style.display = 'none';
                }, 5000);
            }
        },
        
        show: function() {
            statusContainer.style.display = 'block';
            this.update();
        }
    };
}

// 初始化网络状态监测
const networkStatus = showNetworkStatus();

// 页面加载完成后检查网络状态
window.addEventListener('load', () => {
    // 延迟2秒检查，确保其他资源已加载
    setTimeout(() => {
        networkStatus.update();
    }, 2000);
});

// 当网络状态变化时更新
window.addEventListener('online', () => {
    networkStatus.update();
});

window.addEventListener('offline', () => {
    networkStatus.update();
});

// 导出网络状态对象
window.networkStatus = networkStatus; 