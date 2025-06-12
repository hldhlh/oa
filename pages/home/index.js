import { createCard } from '../../components/ui.js';

// 首页渲染函数
export default function renderHomePage(container) {
    // 创建首页内容
    container.innerHTML = `
        <div class="py-12">
            <!-- 欢迎区域 -->
            <div class="text-center mb-16">
                <div class="inline-block p-3 bg-primary bg-opacity-20 rounded-full mb-4">
                    <svg class="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                </div>
                <h1 class="text-4xl font-bold text-gray-800 mb-4">欢迎使用办公自动化系统</h1>
                <p class="text-xl text-gray-600 max-w-2xl mx-auto">提高工作效率，简化办公流程，让团队协作更加便捷</p>
            </div>
            
            <!-- 功能区域 -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                <div id="feature-1"></div>
                <div id="feature-2"></div>
                <div id="feature-3"></div>
            </div>
            
            <!-- 统计数据 -->
            <div class="bg-white rounded-2xl shadow-neumorphism p-8 mb-16">
                <h2 class="text-2xl font-bold text-gray-800 mb-6 text-center">系统概览</h2>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="text-center p-4">
                        <div class="text-3xl font-bold text-primary mb-2">120+</div>
                        <div class="text-gray-600">活跃用户</div>
                    </div>
                    <div class="text-center p-4">
                        <div class="text-3xl font-bold text-accent mb-2">85%</div>
                        <div class="text-gray-600">工作效率提升</div>
                    </div>
                    <div class="text-center p-4">
                        <div class="text-3xl font-bold text-secondary mb-2">50+</div>
                        <div class="text-gray-600">业务流程</div>
                    </div>
                    <div class="text-center p-4">
                        <div class="text-3xl font-bold text-yellow-400 mb-2">24/7</div>
                        <div class="text-gray-600">全天候服务</div>
                    </div>
                </div>
            </div>
            
            <!-- 动态图表 -->
            <div class="bg-white rounded-2xl shadow-neumorphism p-8 mb-16">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">工作效率趋势</h2>
                <div class="h-64 relative">
                    <svg class="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                        <!-- 网格线 -->
                        <line x1="0" y1="0" x2="0" y2="300" stroke="#e5e7eb" stroke-width="1" />
                        <line x1="0" y1="300" x2="800" y2="300" stroke="#e5e7eb" stroke-width="1" />
                        <line x1="0" y1="225" x2="800" y2="225" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="5,5" />
                        <line x1="0" y1="150" x2="800" y2="150" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="5,5" />
                        <line x1="0" y1="75" x2="800" y2="75" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="5,5" />
                        
                        <!-- 折线图 -->
                        <path 
                            d="M0,250 C50,230 100,180 200,170 S350,120 400,100 S550,50 600,70 S750,90 800,40" 
                            fill="none" 
                            stroke="#f8a5c2" 
                            stroke-width="3"
                            stroke-linecap="round"
                            stroke-dasharray="1200"
                            stroke-dashoffset="1200"
                        >
                            <animate 
                                attributeName="stroke-dashoffset" 
                                from="1200" 
                                to="0" 
                                dur="2s" 
                                begin="0.5s"
                                fill="freeze" 
                            />
                        </path>
                        
                        <!-- 数据点 -->
                        <circle cx="0" cy="250" r="5" fill="#f8a5c2" opacity="0">
                            <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="0.5s" fill="freeze" />
                        </circle>
                        <circle cx="200" cy="170" r="5" fill="#f8a5c2" opacity="0">
                            <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1s" fill="freeze" />
                        </circle>
                        <circle cx="400" cy="100" r="5" fill="#f8a5c2" opacity="0">
                            <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="1.5s" fill="freeze" />
                        </circle>
                        <circle cx="600" cy="70" r="5" fill="#f8a5c2" opacity="0">
                            <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="2s" fill="freeze" />
                        </circle>
                        <circle cx="800" cy="40" r="5" fill="#f8a5c2" opacity="0">
                            <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin="2.5s" fill="freeze" />
                        </circle>
                    </svg>
                    
                    <!-- 坐标轴标签 -->
                    <div class="absolute bottom-0 left-0 w-full flex justify-between text-xs text-gray-500">
                        <span>一月</span>
                        <span>二月</span>
                        <span>三月</span>
                        <span>四月</span>
                        <span>五月</span>
                    </div>
                </div>
            </div>
            
            <!-- 号召性用语 -->
            <div class="text-center bg-primary bg-opacity-10 rounded-2xl p-10">
                <h2 class="text-3xl font-bold text-gray-800 mb-4">立即开始使用</h2>
                <p class="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">加入我们，体验高效办公的全新方式，让工作更简单，协作更顺畅</p>
                <div class="flex justify-center gap-4">
                    <a href="/register" class="px-8 py-3 bg-primary text-white rounded-xl hover:bg-opacity-90 transition-colors font-medium">免费注册</a>
                    <a href="/login" class="px-8 py-3 border border-primary text-primary rounded-xl hover:bg-primary hover:text-white transition-colors font-medium">立即登录</a>
                </div>
            </div>
        </div>
    `;
    
    // 创建功能卡片
    const feature1 = createCard({
        title: '文档管理',
        content: `
            <div class="flex items-center mb-4">
                <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                    <svg class="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                </div>
                <p class="text-gray-600">集中管理所有文档，支持在线编辑、版本控制和权限管理</p>
            </div>
        `,
        hoverable: true,
        onClick: () => window.location.href = '/documents'
    });
    
    const feature2 = createCard({
        title: '流程审批',
        content: `
            <div class="flex items-center mb-4">
                <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                    <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                    </svg>
                </div>
                <p class="text-gray-600">自定义审批流程，实时跟踪审批进度，提高工作效率</p>
            </div>
        `,
        hoverable: true,
        onClick: () => window.location.href = '/approvals'
    });
    
    const feature3 = createCard({
        title: '团队协作',
        content: `
            <div class="flex items-center mb-4">
                <div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mr-4">
                    <svg class="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                </div>
                <p class="text-gray-600">团队实时沟通，任务分配与跟踪，项目进度一目了然</p>
            </div>
        `,
        hoverable: true,
        onClick: () => window.location.href = '/teams'
    });
    
    // 将卡片添加到页面
    document.getElementById('feature-1').appendChild(feature1);
    document.getElementById('feature-2').appendChild(feature2);
    document.getElementById('feature-3').appendChild(feature3);
} 