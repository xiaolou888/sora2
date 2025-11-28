// 后端服务器 - 用于隐藏 API 密钥
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

// 加载环境变量（如果使用 .env 文件）
try {
    require('dotenv').config();
} catch (e) {
    console.log('未安装 dotenv，将使用默认配置或环境变量');
}

const app = express();
const PORT = process.env.PORT || 4000;

// API 配置 - 只存在于服务器端，用户看不到
// 建议使用环境变量存储敏感信息
const API_CONFIG = {
    baseUrl: process.env.API_BASE_URL || 'https://xxxxxx.com',
    token: process.env.API_TOKEN || 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',  // 👈 请替换为你的真实 API Token
    model: process.env.API_MODEL || 'sora_url'
};

// 中间件
app.use(cors()); // 允许跨域
app.use(express.json()); // 解析 JSON
app.use(express.static('.')); // 提供静态文件服务

// API 代理接口
app.post('/api/parse-video', async (req, res) => {
    try {
        const { url } = req.body;
        
        // 验证输入
        if (!url) {
            return res.status(400).json({
                success: false,
                message: '请提供视频链接'
            });
        }
        
        // 构建要发送的内容
        let contentToSend = url;
        if (url.startsWith('s_')) {
            contentToSend = `https://sora.chatgpt.com/p/${url}`;
        }
        
        console.log('========== 新请求 ==========');
        console.log('时间:', new Date().toISOString());
        console.log('原始输入:', url);
        console.log('处理后的内容:', contentToSend);
        console.log('API 地址:', `${API_CONFIG.baseUrl}/v1/chat/completions`);
        console.log('Token (前10位):', API_CONFIG.token.substring(0, 10) + '...');
        
        // 调用真实的 API（SK 在服务器端，用户看不到）
        const response = await fetch(`${API_CONFIG.baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_CONFIG.token}`
            },
            body: JSON.stringify({
                model: API_CONFIG.model,
                messages: [
                    {
                        role: 'user',
                        content: contentToSend
                    }
                ],
                stream: false
            })
        });
        
        const responseText = await response.text();
        console.log('响应状态:', response.status);
        console.log('响应内容 (前200字符):', responseText.substring(0, 200));
        
        if (!response.ok) {
            console.error('❌ API 错误 - 状态码:', response.status);
            console.error('完整响应:', responseText);
            let errorMsg = 'API 请求失败';
            try {
                const errorData = JSON.parse(responseText);
                if (errorData.error && errorData.error.message) {
                    errorMsg = errorData.error.message;
                }
            } catch (e) {
                errorMsg = responseText;
            }
            return res.status(response.status).json({
                success: false,
                message: errorMsg
            });
        }
        
        const data = JSON.parse(responseText);
        
        // 检查响应数据
        if (!data.links || !data.links.mp4) {
            return res.status(500).json({
                success: false,
                message: 'API 返回的数据格式不正确'
            });
        }
        
        // 返回处理后的数据
        res.json({
            success: true,
            videoUrl: data.links.mp4,
            prompt: data.links.text || data.post_info?.title || '',
            thumbnail: data.links.thumbnail || '',
            postInfo: data.post_info
        });
        
    } catch (error) {
        console.error('❌ 服务器错误:', error.message);
        console.error('错误堆栈:', error.stack);
        console.error('错误类型:', error.name);
        res.status(500).json({
            success: false,
            message: '服务器内部错误: ' + error.message
        });
    }
});

// 视频代理接口（解决 HTTP/2 协议错误）
app.get('/api/proxy-video', async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).send('缺少视频 URL');
        }
        
        console.log('代理视频请求:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            return res.status(response.status).send('视频获取失败');
        }
        
        // 转发响应头
        res.setHeader('Content-Type', response.headers.get('content-type') || 'video/mp4');
        res.setHeader('Content-Length', response.headers.get('content-length'));
        res.setHeader('Accept-Ranges', 'bytes');
        
        // 流式传输视频
        response.body.pipe(res);
        
    } catch (error) {
        console.error('视频代理错误:', error);
        res.status(500).send('视频代理失败');
    }
});

// 健康检查接口
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: '服务运行正常' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📝 API 端点: http://localhost:${PORT}/api/parse-video`);
});

