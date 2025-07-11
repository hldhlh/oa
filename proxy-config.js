/**
 * Supabase代理服务器配置
 * 
 * 此文件用于配置Nginx或其他代理服务器，以便在中国区域访问Supabase服务
 * 
 * 使用方法：
 * 1. 在您的服务器上安装Nginx
 * 2. 将以下配置添加到Nginx配置文件中
 * 3. 重启Nginx服务
 */

/**
 * Nginx配置示例
 * 
 * server {
 *     listen 80;
 *     server_name your-domain.com;
 * 
 *     location /supabase/ {
 *         proxy_pass https://qdcdhxlguuoksfhelywt.supabase.co/;
 *         proxy_set_header Host qdcdhxlguuoksfhelywt.supabase.co;
 *         proxy_set_header X-Real-IP $remote_addr;
 *         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
 *         proxy_set_header X-Forwarded-Proto $scheme;
 *         proxy_ssl_server_name on;
 *         proxy_ssl_name qdcdhxlguuoksfhelywt.supabase.co;
 *         proxy_buffering off;
 *         proxy_http_version 1.1;
 *         proxy_read_timeout 90s;
 *     }
 * 
 *     # SSL配置（推荐）
 *     # listen 443 ssl;
 *     # ssl_certificate /path/to/your/certificate.crt;
 *     # ssl_certificate_key /path/to/your/private.key;
 *     # ssl_protocols TLSv1.2 TLSv1.3;
 * }
 */

/**
 * 如果使用代理服务器，请修改supabase.js中的服务器URL
 * 
 * const supabaseUrl = 'https://your-domain.com/supabase';
 */ 