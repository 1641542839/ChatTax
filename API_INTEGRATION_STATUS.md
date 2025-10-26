# API Integration Status - Frontend ↔️ Backend

## ✅ 已修复的连接

### Chat Stream Endpoint
- **前端**: `POST /api/chat/stream` ✅
- **后端**: `POST /api/chat/stream` ✅
- **状态**: 🟢 **已连接**

---

## 📋 完整的API端点列表

### 🔐 Authentication (`/api/auth`)
| 端点 | 方法 | 描述 | 前端集成 |
|------|------|------|---------|
| `/api/auth/register` | POST | 用户注册 | ❓ 待确认 |
| `/api/auth/login` | POST | 用户登录 | ❓ 待确认 |

### 💬 Chat (`/api/chat`)
| 端点 | 方法 | 描述 | 前端集成 |
|------|------|------|---------|
| `/api/chat/stream` | POST | SSE流式聊天 | ✅ **已连接** |
| `/api/chat/query` | POST | RAG查询 (FAISS+Reranking) | ❌ 未使用 |
| `/api/chat/stats` | GET | 向量库统计信息 | ❌ 未使用 |

### 📊 Query Parameters for `/api/chat/query`
```typescript
// 前端可以这样调用RAG查询：
fetch('/api/chat/query?use_reranking=true&initial_candidates=20', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "How to claim home office deduction?",
    user_type: "individual",
    top_k: 5
  })
})
```

---

## 🚀 启动步骤

### 后端
```bash
cd Backend
python -m uvicorn main:app --reload --port 8000
```

### 前端
```bash
cd Frontend
npm run dev
```

---

## 🧪 测试连接

### 1. 测试后端是否运行
```bash
curl http://localhost:8000/
curl http://localhost:8000/health
```

### 2. 测试前端代理配置
检查 `Frontend/next.config.js` 或 `vite.config.ts` 是否配置了代理：
```javascript
// Next.js
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*',
    },
  ]
}

// Vite
proxy: {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: true,
  }
}
```

### 3. 测试SSE聊天
在前端ChatBox输入消息，应该看到流式响应。

---

## ⚠️ 潜在问题

### 1. CORS配置
确保 `Backend/.env` 中：
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 2. SSE响应格式
后端当前返回：
```json
{"event": "message", "data": {"content": "chunk"}}
```

前端期望：
```json
data: {"type": "chunk", "content": "..."}
```

**需要修复后端SSE格式！**

---

## 🔧 下一步需要做的

### 优先级 1 (必须)
- [ ] 修复SSE响应格式匹配
- [ ] 测试前端→后端连接
- [ ] 确认CORS配置

### 优先级 2 (推荐)
- [ ] 集成RAG查询端点到前端
- [ ] 添加两阶段检索的UI控制（开关reranking）
- [ ] 显示文档来源和置信度

### 优先级 3 (可选)
- [ ] 集成认证端点
- [ ] 添加向量库统计信息显示
- [ ] 性能监控

---

## 📝 当前状态总结

✅ **已完成**:
- 后端两阶段检索系统 (FAISS + Cross-Encoder)
- 前端SSE流式聊天Hook
- API端点路由修复

⚠️ **需要修复**:
- SSE响应格式不匹配
- 前端代理配置确认
- CORS配置测试

❌ **未集成**:
- RAG查询功能到前端UI
- 认证功能
- 文档来源显示

---

**更新时间**: 2025-10-26  
**状态**: 🟡 部分连接，需要格式修复
