// 全局变量
let currentVideoUrl = null;
let currentPrompt = null;

// API 配置 - 通过后端代理，不暴露 SK
const API_CONFIG = {
    // 前后端在同一域名下，使用相对路径
    backendUrl: '/api/parse-video'
    
    // 如果后端部署在不同的服务器，取消下面的注释并修改地址
    // backendUrl: 'https://your-backend-domain.com/api/parse-video'
};

// DOM 元素
const soraInput = document.getElementById('soraInput');
const clearBtn = document.getElementById('clearBtn');
const soraForm = document.getElementById('soraForm');
const submitBtn = document.getElementById('submitBtn');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const successSection = document.getElementById('successSection');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const videoPreviewSection = document.getElementById('videoPreviewSection');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const videoWrapper = document.getElementById('videoWrapper');
const videoPlayer = document.getElementById('videoPlayer');
const videoLoading = document.getElementById('videoLoading');
const promptCard = document.getElementById('promptCard');
const promptContent = document.getElementById('promptContent');
const copyPromptBtn = document.getElementById('copyPromptBtn');
const qrcodeLink = document.getElementById('qrcodeLink');

// 输入框变化监听
soraInput.addEventListener('input', (e) => {
    const value = e.target.value.trim();
    clearBtn.style.display = value ? 'flex' : 'none';
    
    // 隐藏错误和成功提示
    hideResults();
});

// 清除按钮
clearBtn.addEventListener('click', () => {
    soraInput.value = '';
    clearBtn.style.display = 'none';
    soraInput.focus();
    hideResults();
});

// 表单提交
soraForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const input = soraInput.value.trim();
    if (!input) {
        showError('请输入 Sora 分享链接或 ID');
        return;
    }
    
    // 提取分享ID
    const shareId = extractShareId(input);
    if (!shareId) {
        showError('无效的分享链接或 ID 格式，请检查后重试');
        return;
    }
    
    // 开始获取视频
    await fetchVideo(shareId);
});

// 提取分享ID或完整URL
function extractShareId(input) {
    input = input.trim();
    
    // 如果是完整的 URL，直接返回
    if (input.startsWith('http://') || input.startsWith('https://')) {
        return input;
    }
    
    // 如果直接是 s_ 开头的ID，返回ID
    if (input.startsWith('s_')) {
        return input;
    }
    
    // 尝试从各种格式中提取
    try {
        // 匹配 s_xxxxx 格式
        const match = input.match(/s_[a-zA-Z0-9_-]+/);
        if (match) {
            return match[0];
        }
    } catch (e) {
        console.error('提取分享ID失败:', e);
    }
    
    return null;
}

// 获取视频 - 通过后端代理
async function fetchVideo(shareIdOrUrl) {
    hideResults();
    setLoading(true);
    
    try {
        console.log('发送请求到后端:', shareIdOrUrl);
        
        // 调用自己的后端 API（不暴露 SK）
        const response = await fetch(API_CONFIG.backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: shareIdOrUrl
            })
        });
        
        const data = await response.json();
        console.log('后端响应:', data);
        
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'API 请求失败');
        }
        
        // 检查响应数据
        if (!data.videoUrl) {
            throw new Error('未获取到视频链接');
        }
        
        currentVideoUrl = data.videoUrl;
        currentPrompt = data.prompt;
        
        showSuccess();
        showVideo(data.videoUrl, data.prompt, data.thumbnail);
        
    } catch (error) {
        console.error('获取视频失败:', error);
        let errorMsg = '获取视频失败，请稍后重试';
        
        if (error.message.includes('Failed to fetch')) {
            errorMsg = '网络连接失败，请检查网络后重试';
        } else if (error.message.includes('无效的视频链接') || error.message.includes('invalid_url')) {
            errorMsg = '无效的视频链接，请确认链接格式正确（支持完整链接或 s_xxxxx 格式的ID）';
        } else if (error.message) {
            errorMsg = error.message;
        }
        
        showError(errorMsg);
    } finally {
        setLoading(false);
    }
}

// 显示视频
function showVideo(videoUrl, prompt, thumbnail) {
    // 隐藏占位符
    previewPlaceholder.style.display = 'none';
    
    // 显示视频容器
    videoWrapper.style.display = 'block';
    videoPreviewSection.classList.add('has-video');
    
    // 显示加载状态
    videoLoading.style.display = 'flex';
    
    // 设置视频源
    videoPlayer.src = videoUrl;
    
    // 如果有缩略图，设置为 poster
    if (thumbnail) {
        videoPlayer.poster = thumbnail;
    }
    
    // 视频加载完成
    videoPlayer.addEventListener('loadeddata', () => {
        videoLoading.style.display = 'none';
    }, { once: true });
    
    // 视频加载错误
    videoPlayer.addEventListener('error', (e) => {
        console.error('视频加载错误:', e);
        videoLoading.style.display = 'none';
        showError('视频加载失败，请稍后重试');
    }, { once: true });
    
    // 显示提示词
    if (prompt) {
        promptContent.textContent = prompt;
        promptCard.style.display = 'block';
    } else {
        promptCard.style.display = 'none';
    }
}

// 复制链接
copyBtn.addEventListener('click', async () => {
    if (!currentVideoUrl) return;
    
    try {
        await navigator.clipboard.writeText(currentVideoUrl);
        
        // 临时改变按钮文字
        const originalText = copyBtn.querySelector('span:last-child').textContent;
        copyBtn.querySelector('span:last-child').textContent = '已复制';
        copyBtn.style.opacity = '0.7';
        
        setTimeout(() => {
            copyBtn.querySelector('span:last-child').textContent = originalText;
            copyBtn.style.opacity = '1';
        }, 2000);
    } catch (error) {
        console.error('复制失败:', error);
        showError('复制失败，请手动复制');
    }
});

// 下载视频
downloadBtn.addEventListener('click', () => {
    if (!currentVideoUrl) return;
    
    const a = document.createElement('a');
    a.href = currentVideoUrl;
    a.download = `sora_video_${Date.now()}.mp4`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

// 复制提示词
copyPromptBtn.addEventListener('click', async () => {
    if (!currentPrompt) return;
    
    try {
        await navigator.clipboard.writeText(currentPrompt);
        
        // 改变按钮图标为对勾
        copyPromptBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="14" height="14">
                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M416 128L192 384l-96-96"/>
            </svg>
        `;
        copyPromptBtn.disabled = true;
        
        setTimeout(() => {
            copyPromptBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="14" height="14">
                    <rect x="128" y="128" width="336" height="336" rx="57" ry="57" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="32"/>
                    <path d="M383.5 128l.5-24a56.16 56.16 0 00-56-56H112a64.19 64.19 0 00-64 64v216a56.16 56.16 0 0056 56h24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
                </svg>
            `;
            copyPromptBtn.disabled = false;
        }, 2000);
    } catch (error) {
        console.error('复制失败:', error);
    }
});

// 二维码链接点击
qrcodeLink.addEventListener('click', () => {
    alert('交流群功能暂未开放');
});

// 显示错误
function showError(message) {
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    successSection.style.display = 'none';
}

// 显示成功
function showSuccess() {
    successSection.style.display = 'block';
    errorSection.style.display = 'none';
}

// 隐藏结果
function hideResults() {
    errorSection.style.display = 'none';
    successSection.style.display = 'none';
}

// 设置加载状态
function setLoading(loading) {
    submitBtn.disabled = loading;
    
    if (loading) {
        submitBtn.querySelector('.btn-text').textContent = '获取中...';
        submitBtn.querySelector('.btn-icon').innerHTML = `
            <svg class="spinner" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="20" height="20">
                <path d="M304 48a48 48 0 1 0-96 0 48 48 0 1 0 96 0zm0 416a48 48 0 1 0-96 0 48 48 0 1 0 96 0zM48 304a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm464-48a48 48 0 1 0-96 0 48 48 0 1 0 96 0zM142.9 437A48 48 0 1 0 75 369.1 48 48 0 1 0 142.9 437zm0-294.2A48 48 0 1 0 75 75a48 48 0 1 0 67.9 67.9zM369.1 437A48 48 0 1 0 437 369.1 48 48 0 1 0 369.1 437z" fill="currentColor"/>
            </svg>
        `;
    } else {
        submitBtn.querySelector('.btn-text').textContent = '立即获取';
        submitBtn.querySelector('.btn-icon').innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="20" height="20">
                <path d="M336 176h40a40 40 0 0 1 40 40v208a40 40 0 0 1-40 40H136a40 40 0 0 1-40-40V216a40 40 0 0 1 40-40h40" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32"/>
                <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M176 272l80 80 80-80M256 48v288"/>
            </svg>
        `;
    }
}

// 页面加载完成
document.addEventListener('DOMContentLoaded', () => {
    console.log('Sora 去水印网站已加载（安全版本）');
    
    // 自动聚焦输入框
    soraInput.focus();
});

