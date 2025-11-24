# Sora 去水印下载网站

一个安全的 Sora 视频去水印下载工具，通过后端代理保护 API 密钥。

## 🔒 安全设计

本项目采用前后端分离架构，API 密钥安全存储在服务器端：

- `script-secure.js` - 前端代码，不包含任何敏感信息
- `server.js` - 后端服务器，API 密钥安全存储
- 用户无法通过浏览器查看或获取 API 密钥

## 📦 部署步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API 密钥

**方式 1：使用环境变量（推荐，更安全）**

```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件，填入你的 API Token
# API_TOKEN=your-api-token-here
```

**方式 2：直接修改 server.js**

编辑 `server.js`，修改 API 配置：

```javascript
const API_CONFIG = {
    baseUrl: 'https://xxxxxx.com',
    token: '你的API密钥',  // 👈 修改这里
    model: 'sora_url'
};
```

⚠️ **注意**：如果直接修改 server.js，请确保不要将包含真实 API Token 的文件提交到 Git！

### 3. 启动服务器

```bash
# 生产环境
npm start

# 开发环境（自动重启）
npm run dev
```

服务器将运行在 `http://localhost:3000`

### 4. 访问网站

打开浏览器访问：`http://localhost:3000`

## 🚀 生产环境部署

### 方式 1：使用 PM2（推荐）

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start server.js --name sora-app

# 设置开机自启
pm2 startup
pm2 save
```

### 方式 2：使用 Docker

```bash
# 构建镜像
docker build -t sora-app .

# 运行容器
docker run -d -p 3000:3000 sora-app
```

### 方式 3：宝塔面板部署（推荐）

#### 步骤 1：安装 Node.js
1. 登录宝塔面板
2. 进入 **软件商店** → 搜索 **Node.js 版本管理器**
3. 安装并进入管理界面
4. 安装 Node.js（推荐 v18 或 v20）

#### 步骤 2：上传项目文件
1. 在宝塔文件管理中，进入网站目录（如 `/www/wwwroot/your-domain.com`）
2. 上传所有项目文件：
   - index.html
   - style.css
   - script-secure.js
   - server.js
   - package.json
   - .gitignore

#### 步骤 3：安装依赖
1. 点击文件夹右侧的 **终端** 按钮
2. 执行命令：
```bash
npm install
```

#### 步骤 4：配置 PM2 守护进程
1. 在宝塔面板，进入 **Node.js 版本管理器**
2. 点击 **项目管理** → **添加项目**
3. 配置如下：
   - **项目名称**：sora-app（自定义）
   - **运行目录**：选择你的项目目录
   - **启动文件**：server.js
   - **端口**：3000（或其他未占用端口）
4. 点击 **提交** 启动项目

#### 步骤 5：配置反向代理
1. 在宝塔面板，进入 **网站** → 点击你的网站 → **反向代理**
2. 添加反向代理：
   - **代理名称**：sora（自定义）
   - **目标URL**：`http://127.0.0.1:3000`
   - **发送域名**：`$host`
   - 勾选 **启用反向代理**
3. 保存配置

#### 步骤 6：配置 SSL 证书（推荐）
1. 在网站设置中，进入 **SSL** 标签
2. 选择 **Let's Encrypt** 免费证书
3. 点击 **申请** 并开启 **强制HTTPS**

#### 步骤 7：测试访问
访问你的域名，应该可以正常使用了！

#### 常见问题

**Q: 项目启动失败？**
- 检查端口是否被占用
- 查看日志：在 Node.js 项目管理中点击 **日志**
- 确认依赖已正确安装

**Q: 访问网站显示 502？**
- 确认 Node.js 项目正在运行
- 检查反向代理配置是否正确
- 查看防火墙是否放行端口

**Q: 如何重启项目？**
- 在 Node.js 项目管理中，点击 **重启** 按钮
- 或使用命令：`pm2 restart sora-app`

**Q: 如何查看日志？**
- 在 Node.js 项目管理中点击 **日志**
- 或使用命令：`pm2 logs sora-app`

### 方式 4：部署到其他云平台

支持部署到：
- Vercel
- Railway
- Render
- Heroku
- 阿里云
- 腾讯云

## 🔧 配置说明

### 修改后端 API 地址

如果后端部署在不同的服务器，编辑 `script-secure.js`：

```javascript
const API_CONFIG = {
    // 使用完整的后端地址
    backendUrl: 'https://your-backend-domain.com/api/parse-video'
};
```

### 修改端口

编辑 `server.js` 或设置环境变量：

```bash
PORT=8080 npm start
```

## 📝 API 接口说明

### POST /api/parse-video

请求体：
```json
{
    "url": "https://sora.chatgpt.com/p/s_xxxxx"
}
```

响应：
```json
{
    "success": true,
    "videoUrl": "视频地址",
    "prompt": "提示词",
    "thumbnail": "缩略图"
}
```

### GET /api/health

健康检查接口

## ⚠️ 安全建议

1. ✅ **永远不要**在前端代码中暴露 API 密钥（本项目已实现）
2. ✅ **使用环境变量**存储敏感信息（推荐使用 .env 文件）
3. ✅ **不要提交 .env 文件**到 Git（已在 .gitignore 中配置）
4. ✅ **使用 HTTPS** 加密传输（生产环境必须）
5. ✅ **定期更换** API 密钥
6. ✅ **监控 API 使用量**，及时发现异常
7. ✅ **添加访问限制**（可选：IP 白名单、请求频率限制等）

### 环境变量说明

本项目支持通过环境变量配置敏感信息：

- `API_BASE_URL`: API 服务地址（默认：https://dyuapi.com）
- `API_TOKEN`: API 访问令牌（必填）
- `API_MODEL`: API 模型名称（默认：sora_url）
- `PORT`: 服务器端口（默认：3000）

## 🛠️ 技术栈

- 前端：HTML + CSS + JavaScript（原生）
- 后端：Node.js + Express
- API：Sora 视频解析 API

## 📄 开源协议

本项目采用 MIT 协议开源，您可以自由地：

- ✅ 商业使用
- ✅ 修改代码
- ✅ 分发代码
- ✅ 私人使用

唯一的要求是在使用时保留原作者的版权声明。

详见 [LICENSE](LICENSE) 文件。

