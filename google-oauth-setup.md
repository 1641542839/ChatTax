# Google OAuth 配置指南

## 🎯 快速配置清单

### 1. Google Cloud Console 设置

#### 访问地址
https://console.cloud.google.com/apis/credentials

#### 配置项目

**Authorised JavaScript origins（已获授权的 JavaScript 来源）**
```
开发环境：
http://localhost:3000
http://localhost:8000

生产环境（部署后添加）：
https://yourdomain.com
https://www.yourdomain.com
```

**Authorised redirect URIs（已获授权的重定向 URI）**
```
开发环境：
http://localhost:3000
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback/google

生产环境（部署后添加）：
https://yourdomain.com
https://yourdomain.com/auth/callback
https://yourdomain.com/auth/callback/google
```

---

## 📝 详细步骤

### Step 1: 创建 Google Cloud 项目

1. 访问 https://console.cloud.google.com/
2. 点击顶部项目下拉菜单
3. 点击 "新建项目"
4. 项目名称：`ChatTax`
5. 点击 "创建"

### Step 2: 启用必要的 API

1. 左侧菜单：**API 和服务** > **库**
2. 搜索并启用：
   - Google+ API
   - Google Identity Services

### Step 3: 配置 OAuth 同意屏幕

1. 左侧菜单：**API 和服务** > **OAuth 同意屏幕**
2. 用户类型：选择 **外部**
3. 点击 "创建"

**填写信息**：
```
应用名称: ChatTax
用户支持电子邮件: 你的邮箱
应用首页: http://localhost:3000 (开发环境)
应用隐私权政策链接: (可选，生产环境需要)
应用服务条款链接: (可选，生产环境需要)
已获授权的网域: localhost (开发环境)
开发者联系信息: 你的邮箱
```

4. 点击 "保存并继续"
5. **范围（Scopes）**：暂时跳过，使用默认
6. **测试用户**：添加你自己的 Google 账号邮箱
7. 点击 "保存并继续"

### Step 4: 创建 OAuth 2.0 凭据

1. 左侧菜单：**API 和服务** > **凭据**
2. 点击顶部 **+ 创建凭据**
3. 选择 **OAuth 客户端 ID**
4. 应用类型：**Web 应用**
5. 名称：`ChatTax Web Client`

**配置 URIs**：

```
已获授权的 JavaScript 来源：
http://localhost:3000
http://localhost:8000

已获授权的重定向 URI：
http://localhost:3000
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback/google
```

6. 点击 "创建"

### Step 5: 保存凭据

会弹出窗口显示：
```
客户端 ID: 123456789-abcdefg.apps.googleusercontent.com
客户端密钥: GOCSPX-abcdefg123456
```

**复制这两个值！**

---

## ⚙️ 配置到项目

### Backend 环境变量

创建/编辑 `Backend/.env`：

```bash
# Google OAuth 2.0
GOOGLE_CLIENT_ID=你的客户端ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-你的客户端密钥
GOOGLE_REDIRECT_URI=http://localhost:3000

# 其他配置...
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///./chattax.db
```

### Frontend 环境变量

创建/编辑 `Frontend/.env.local`：

```bash
# Google OAuth 2.0
NEXT_PUBLIC_GOOGLE_CLIENT_ID=你的客户端ID.apps.googleusercontent.com

# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## 🧪 测试配置

### 1. 启动 Backend

```powershell
cd Backend
python -m uvicorn app.main:app --reload --port 8000
```

### 2. 启动 Frontend

```powershell
cd Frontend
npm run dev
```

### 3. 测试登录

1. 访问 http://localhost:3000/login
2. 点击 "Sign in with Google"
3. 选择你的测试 Google 账号
4. 应该成功登录并跳转到 `/chat`

---

## ❌ 常见错误

### Error: redirect_uri_mismatch

**原因**：重定向 URI 未在 Google Console 配置

**解决**：
1. 检查 Frontend `.env.local` 中的域名
2. 确保 Google Console 中配置了对应的 redirect URI
3. 注意 `http://` vs `https://` 要匹配
4. 注意端口号要匹配（如 `:3000`）

### Error: origin_mismatch

**原因**：JavaScript 来源未配置

**解决**：
在 Google Console 的 "已获授权的 JavaScript 来源" 中添加：
- `http://localhost:3000`

### Error: invalid_client

**原因**：客户端 ID 或密钥错误

**解决**：
1. 检查 `.env` 文件中的 `GOOGLE_CLIENT_ID`
2. 检查 `.env` 文件中的 `GOOGLE_CLIENT_SECRET`
3. 确保没有多余的空格或引号

---

## 🚀 生产环境部署

### 更新 Google Console 配置

部署到生产环境后，需要添加生产域名：

**已获授权的 JavaScript 来源**：
```
https://yourdomain.com
https://www.yourdomain.com
```

**已获授权的重定向 URI**：
```
https://yourdomain.com
https://yourdomain.com/auth/callback
https://yourdomain.com/auth/callback/google
```

### 发布 OAuth 同意屏幕

1. 进入 **OAuth 同意屏幕**
2. 点击 "发布应用"
3. 可能需要 Google 审核（需要提供隐私政策等）

---

## 🔒 安全提示

1. **不要泄露 `GOOGLE_CLIENT_SECRET`**
   - 不要提交到 Git
   - 不要在前端代码中使用
   - 只在 Backend 服务器使用

2. **`.env` 文件加入 `.gitignore`**
   ```gitignore
   .env
   .env.local
   ```

3. **使用环境变量**
   - 开发环境：`.env.local`
   - 生产环境：服务器环境变量

---

## 📞 需要帮助？

如果遇到问题：
1. 检查 Browser Console（F12）查看错误信息
2. 检查 Backend 日志
3. 参考 Google OAuth 错误文档：https://developers.google.com/identity/protocols/oauth2

---

**配置完成后，删除此文件或添加到 `.gitignore`！**
