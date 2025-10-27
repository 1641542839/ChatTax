# Checklist API 前端集成指南

## 📋 功能概述

ChatTax 的 Checklist 功能已经完全集成后端 API，支持：
- ✅ **AI 生成个性化清单** - 根据用户税务情况自动生成 5-15 个任务
- ✅ **实时状态同步** - 任务状态自动同步到后端数据库
- ✅ **智能加载** - 自动从 API 加载，失败则使用本地数据
- ✅ **进度追踪** - 实时显示完成进度

---

## 🚀 快速开始

### 1️⃣ 启动后端服务

```powershell
cd Backend
.\venv\Scripts\activate
uvicorn main:app --reload
```

后端将运行在 `http://localhost:8000`

### 2️⃣ 启动前端服务

```powershell
cd Frontend
npm run dev
```

前端将运行在 `http://localhost:3000`

### 3️⃣ 使用功能

访问以下页面：
- **生成清单**: http://localhost:3000/checklist/generate
- **查看清单**: http://localhost:3000/checklist

---

## 📂 项目结构

```
Frontend/
├── src/
│   ├── services/
│   │   └── checklistService.ts        # 🆕 API 服务封装
│   ├── store/
│   │   └── checklistStore.ts          # ✨ 更新：添加 API 集成
│   ├── app/
│   │   └── checklist/
│   │       ├── page.tsx               # ✨ 更新：智能加载数据
│   │       └── generate/
│   │           └── page.tsx           # 🆕 生成清单表单
│   └── components/
│       └── checklist/
│           └── TaskCard.tsx           # ✨ 更新：同步状态到 API
```

---

## 🔧 核心代码说明

### 1. API 服务层 (`checklistService.ts`)

封装所有后端 API 调用：

```typescript
import * as checklistService from '@/services/checklistService'

// 生成新清单
const response = await checklistService.generateChecklist({
  user_id: 1,
  identity_info: {
    employment_status: 'employed',
    income_sources: ['salary', 'investment'],
    has_dependents: true,
    has_investment: true,
    has_rental_property: false,
  }
})

// 获取清单
const checklist = await checklistService.getChecklist(checklistId, userId)

// 更新任务状态
await checklistService.updateItemStatus(checklistId, userId, {
  item_id: 'doc_001',
  status: 'done'
})
```

### 2. Store 管理 (`checklistStore.ts`)

Zustand store 现在支持 API 操作：

```typescript
const {
  // 本地操作
  tasks,
  toggleTaskStatus,
  
  // API 操作
  generateChecklistFromAPI,    // 生成新清单
  loadChecklistFromAPI,         // 加载指定清单
  loadUserChecklistsFromAPI,    // 加载用户清单列表
  updateTaskStatusInAPI,        // 更新状态到后端
  
  // 状态
  isLoading,
  error,
  currentChecklistId,           // 当前清单 ID
} = useChecklistStore()
```

### 3. 生成清单页面 (`/checklist/generate`)

表单收集用户信息，调用 API 生成清单：

```typescript
// 在组件中
const { generateChecklistFromAPI } = useChecklistStore()

// 提交表单
const handleGenerate = async (values) => {
  const identityInfo = createIdentityInfo(values.employmentStatus, {
    incomeSources: values.incomeSources,
    hasDependents: values.hasDependents,
    // ...
  })
  
  await generateChecklistFromAPI(1, identityInfo)
  router.push('/checklist')  // 跳转到清单页面
}
```

### 4. 清单列表页面 (`/checklist`)

智能加载数据，支持本地/API 双模式：

```typescript
useEffect(() => {
  const initializeData = async () => {
    try {
      // 尝试从 API 加载
      await loadUserChecklistsFromAPI(1)
      setDataSource('api')
    } catch (err) {
      // 失败则使用本地数据
      initializeDefaultTasks()
      setDataSource('local')
    }
  }
  
  initializeData()
}, [])
```

### 5. 任务卡片 (`TaskCard.tsx`)

自动同步状态到后端：

```typescript
const handleToggle = async () => {
  if (currentChecklistId) {
    // 有 API 连接，同步到后端
    await updateTaskStatusInAPI(task.id, newStatus, userId)
  } else {
    // 本地模式
    toggleTaskStatus(task.id)
  }
}
```

---

## 🎯 使用场景示例

### 场景 1：新用户生成清单

1. 访问 `/checklist/generate`
2. 填写表单：
   - 就业状态：在职员工
   - 收入来源：工资、投资
   - 有抚养人：✅
   - 有投资：✅
3. 点击"生成个性化清单"
4. AI 生成 10 个个性化任务
5. 自动跳转到 `/checklist` 查看

### 场景 2：查看和更新清单

1. 访问 `/checklist`
2. 页面自动加载用户的最新清单
3. 点击任务的复选框：
   - `todo` → `doing` → `done` → `todo`
4. 状态实时同步到后端

### 场景 3：离线使用

1. 后端服务未启动
2. 访问 `/checklist`
3. 自动使用本地默认数据
4. 功能正常，但不同步到后端

---

## 🔍 API 端点映射

| 前端操作 | API 端点 | 方法 |
|---------|---------|------|
| 生成清单 | `/api/checklist/generate` | POST |
| 加载单个清单 | `/api/checklist/{id}?user_id={userId}` | GET |
| 加载用户清单 | `/api/checklist/user/{userId}` | GET |
| 更新任务状态 | `/api/checklist/{id}/status?user_id={userId}` | PATCH |
| 删除清单 | `/api/checklist/{id}?user_id={userId}` | DELETE |

---

## ⚙️ 配置

### 环境变量

创建 `Frontend/.env.local`：

```env
# API 基础 URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 默认值

如果未设置环境变量，默认使用 `http://localhost:8000`

---

## 🐛 调试技巧

### 1. 检查 API 连接

打开浏览器控制台，查看网络请求：

```
Network > Fetch/XHR
```

### 2. 查看 Store 状态

在组件中添加：

```typescript
const store = useChecklistStore()
console.log('Current state:', {
  tasks: store.tasks,
  currentChecklistId: store.currentChecklistId,
  isLoading: store.isLoading,
  error: store.error,
})
```

### 3. 测试 API

使用浏览器直接访问：

```
http://localhost:8000/api/checklist/user/1
```

---

## 📊 数据流程图

```
用户填写表单
    ↓
checklistService.generateChecklist()
    ↓
POST /api/checklist/generate
    ↓
后端 LLM 生成清单
    ↓
保存到数据库
    ↓
返回清单 JSON
    ↓
Store 更新 tasks
    ↓
页面渲染任务列表
    ↓
用户点击复选框
    ↓
updateTaskStatusInAPI()
    ↓
PATCH /api/checklist/{id}/status
    ↓
数据库更新状态
    ↓
Store 同步状态
    ↓
UI 更新 ✅
```

---

## 🎨 UI 特性

### 状态指示器

- **🔗 API #5** - 显示当前加载的清单 ID（API 模式）
- **📁 本地数据** - 显示使用本地数据（离线模式）

### 进度条

- 实时显示完成百分比
- 颜色渐变：蓝色 → 绿色
- 显示剩余任务数量

### 加载状态

- Spin 组件显示"加载中..."
- 按钮显示 loading 状态
- 禁用交互直到加载完成

### 错误处理

- Alert 组件显示错误信息
- Toast 提示操作结果
- 失败自动回滚本地状态

---

## 🚀 高级功能

### 1. 多清单支持

```typescript
// 加载所有清单
const checklists = await checklistService.getUserChecklists(userId)

// 切换清单
await store.loadChecklistFromAPI(checklistId, userId)
```

### 2. 乐观更新

状态立即更新 UI，后台同步到服务器：

```typescript
// 先更新本地
updateLocalState()

// 后同步远程
await syncToBackend()

// 失败则回滚
if (error) revertLocalState()
```

### 3. 自定义身份信息

```typescript
const customInfo = createIdentityInfo('self_employed', {
  incomeSources: ['business', 'rental'],
  hasInvestment: true,
  additionalInfo: {
    business_type: 'consulting',
    annual_revenue: 150000,
  }
})
```

---

## 📚 相关文档

- [后端 API 文档](../../Backend/CHECKLIST_API.md)
- [后端快速开始](../../Backend/CHECKLIST_QUICKSTART.md)
- [SOLID 设计原则](../../Backend/CODING_RULES.md)

---

## ✅ 检查清单

使用前确认：

- [ ] 后端服务运行中 (`uvicorn main:app --reload`)
- [ ] 前端服务运行中 (`npm run dev`)
- [ ] 数据库已初始化（自动创建表）
- [ ] 环境变量已配置（可选）
- [ ] OpenAI API Key 已设置（在后端 `.env`）

---

## 🎉 完成！

现在你可以：
1. 访问 `/checklist/generate` 生成个性化清单
2. 在 `/checklist` 查看和管理任务
3. 任务状态自动同步到后端数据库

有问题？查看浏览器控制台或后端日志！
