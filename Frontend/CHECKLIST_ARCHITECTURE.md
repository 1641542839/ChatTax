# 🏗️ Checklist 功能架构说明

## 📊 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         前端 (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐      ┌──────────────────┐              │
│  │  生成清单页面   │      │   清单列表页面    │              │
│  │  /generate      │─────▶│   /checklist     │              │
│  └────────┬───────┘      └──────┬───────────┘              │
│           │                      │                           │
│           │                      │                           │
│  ┌────────▼──────────────────────▼───────────┐              │
│  │         Zustand Store                      │              │
│  │  ┌──────────────┐  ┌────────────────┐     │              │
│  │  │  本地操作     │  │   API 操作     │     │              │
│  │  │  toggleTask  │  │  generateAPI   │     │              │
│  │  │  addTask     │  │  loadAPI       │     │              │
│  │  └──────────────┘  │  updateAPI     │     │              │
│  │                    └────────┬───────┘     │              │
│  └─────────────────────────────┼─────────────┘              │
│                                 │                            │
│  ┌──────────────────────────────▼──────────┐                │
│  │      checklistService.ts                │                │
│  │  ┌────────────────────────────────┐     │                │
│  │  │  generateChecklist()           │     │                │
│  │  │  getChecklist()                │     │                │
│  │  │  updateItemStatus()            │     │                │
│  │  │  deleteChecklist()             │     │                │
│  │  └────────────────┬───────────────┘     │                │
│  └────────────────────┼──────────────────────┘              │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │ HTTP Fetch
                        │
┌───────────────────────▼──────────────────────────────────────┐
│                      后端 (FastAPI)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────┐       │
│  │          checklist.py (Router)                   │       │
│  │  POST   /api/checklist/generate                  │       │
│  │  GET    /api/checklist/{id}                      │       │
│  │  PATCH  /api/checklist/{id}/status               │       │
│  │  DELETE /api/checklist/{id}                      │       │
│  └─────────────────────┬────────────────────────────┘       │
│                        │                                     │
│  ┌─────────────────────▼───────────────────────────┐        │
│  │      ChecklistService (Service Layer)           │        │
│  │  ┌─────────────────────────────────────┐        │        │
│  │  │  generate_and_save_checklist()      │        │        │
│  │  │  get_checklist()                    │        │        │
│  │  │  update_item_status()               │        │        │
│  │  │  delete_checklist()                 │        │        │
│  │  └────────┬────────────────────────────┘        │        │
│  └───────────┼──────────────────────────────────────┘        │
│              │                                               │
│  ┌───────────▼───────────┐     ┌──────────────────┐         │
│  │   LLMService          │     │  Database (ORM)  │         │
│  │  generate_checklist() │     │  Checklist Model │         │
│  └───────────────────────┘     └──────────────────┘         │
│              │                           │                   │
└──────────────┼───────────────────────────┼───────────────────┘
               │                           │
               │                           │
         ┌─────▼──────┐            ┌──────▼─────┐
         │ OpenAI API │            │ PostgreSQL │
         │  GPT-4o    │            │  /SQLite   │
         └────────────┘            └────────────┘
```

---

## 🔄 数据流程

### 1️⃣ 生成清单流程

```
用户访问 /checklist/generate
         │
         ▼
填写表单（就业状态、收入来源等）
         │
         ▼
点击"生成个性化清单"
         │
         ▼
前端: generateChecklistFromAPI(userId, identityInfo)
         │
         ▼
API Service: POST /api/checklist/generate
         │
         ▼
后端 Router: checklist.generate_checklist()
         │
         ▼
Service Layer: generate_and_save_checklist()
         │
         ├─▶ LLMService: 调用 OpenAI GPT-4o
         │   生成 5-15 个个性化任务
         │
         └─▶ Database: 保存清单到数据库
         │
         ▼
返回 ChecklistResponse (201 Created)
         │
         ▼
前端 Store: 更新 tasks 和 currentChecklistId
         │
         ▼
路由跳转到 /checklist
         │
         ▼
显示生成的任务列表 ✅
```

### 2️⃣ 加载清单流程

```
用户访问 /checklist
         │
         ▼
useEffect: loadUserChecklistsFromAPI(userId)
         │
         ▼
API Service: GET /api/checklist/user/{userId}
         │
         ▼
后端: 查询数据库获取用户所有清单
         │
         ▼
返回清单数组 (最新的清单)
         │
         ▼
前端 Store: 转换为 Task 格式并更新 state
         │
         ▼
渲染任务列表
         │
         ├─▶ 显示进度条
         ├─▶ 显示清单 ID 标签
         └─▶ 显示任务卡片 ✅
```

### 3️⃣ 更新状态流程

```
用户点击任务复选框
         │
         ▼
TaskCard: handleToggle()
         │
         ▼
判断: currentChecklistId 存在？
         │
         ├─ YES (API 模式)
         │         │
         │         ▼
         │  乐观更新: 立即更新本地 UI
         │         │
         │         ▼
         │  API Service: PATCH /api/checklist/{id}/status
         │         │
         │         ▼
         │  后端: 更新数据库 JSON 字段
         │         │
         │         ├─ 成功 ▶ 显示成功 toast ✅
         │         │
         │         └─ 失败 ▶ 回滚本地状态 ❌
         │
         └─ NO (本地模式)
                   │
                   ▼
            toggleTaskStatus() - 仅更新本地状态
```

---

## 📦 核心组件详解

### Frontend Components

#### 1. **checklistService.ts** (API 层)
- **职责**: 封装所有 HTTP 请求
- **特点**: 
  - 类型安全的 TypeScript 接口
  - 统一的错误处理
  - 可配置的 API Base URL

```typescript
// 示例
export async function generateChecklist(
  request: GenerateChecklistRequest
): Promise<ChecklistResponse> {
  const response = await fetch(`${API_BASE}/api/checklist/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  return response.json()
}
```

#### 2. **checklistStore.ts** (状态管理)
- **职责**: 管理清单状态和业务逻辑
- **特点**:
  - Zustand 轻量级状态管理
  - 本地操作 + API 操作分离
  - 乐观更新 + 失败回滚

```typescript
// 状态结构
{
  tasks: Task[],                    // 任务列表
  currentChecklistId: number | null, // 当前清单 ID
  isLoading: boolean,                // 加载状态
  error: string | null,              // 错误信息
  filter: 'all' | 'todo' | 'doing' | 'done', // 过滤器
  
  // 方法
  generateChecklistFromAPI,
  updateTaskStatusInAPI,
  ...
}
```

#### 3. **生成页面** (`/checklist/generate`)
- **职责**: 收集用户信息，生成清单
- **特点**:
  - Ant Design 表单组件
  - 验证规则
  - 加载状态管理
  - 成功后自动跳转

#### 4. **清单页面** (`/checklist`)
- **职责**: 显示和管理任务
- **特点**:
  - 智能数据加载（API 优先，本地后备）
  - 进度可视化
  - 过滤和排序
  - 实时状态更新

#### 5. **TaskCard 组件**
- **职责**: 单个任务的展示和操作
- **特点**:
  - 复选框切换状态
  - 优先级和分类标签
  - API 同步（乐观更新）
  - 加载状态反馈

---

### Backend Components

#### 1. **Router** (`checklist.py`)
- **职责**: 定义 API 端点
- **特点**:
  - RESTful 设计
  - 参数验证
  - 依赖注入

#### 2. **Service** (`checklist_service.py`)
- **职责**: 业务逻辑处理
- **特点**:
  - SOLID 原则
  - 事务管理
  - 错误处理

#### 3. **Model** (`checklist.py`)
- **职责**: 数据库模型
- **特点**:
  - SQLAlchemy ORM
  - JSON 字段存储灵活数据
  - 时间戳自动管理

#### 4. **LLM Service** (`llm_service.py`)
- **职责**: AI 清单生成
- **特点**:
  - OpenAI GPT-4o 集成
  - Prompt 工程
  - 降级策略（默认清单）

---

## 🔐 类型系统

### 共享类型定义

前后端类型对应关系：

| 前端 (TypeScript) | 后端 (Python) | 说明 |
|------------------|--------------|------|
| `ChecklistIdentityInfo` | `ChecklistIdentityInfo` | 用户身份信息 |
| `ChecklistItem` | `ChecklistItem` | 单个任务项 |
| `ChecklistResponse` | `ChecklistResponse` | 完整清单响应 |
| `TaskStatus` | `Literal['todo', 'doing', 'done']` | 任务状态枚举 |

---

## ⚡ 性能优化

### 1. 乐观更新
状态立即更新 UI，后台异步同步到服务器

### 2. 智能缓存
Store 保持当前清单状态，避免重复请求

### 3. 错误回滚
API 失败时自动恢复到之前的状态

### 4. 加载指示
所有异步操作都有明确的 loading 状态

---

## 🛡️ 错误处理

### 前端
```typescript
try {
  await updateTaskStatusInAPI(itemId, newStatus, userId)
  message.success('✅ 更新成功')
} catch (error) {
  message.error('更新失败，请重试')
  // 回滚到之前的状态
  await loadChecklistFromAPI(checklistId, userId)
}
```

### 后端
```python
@router.patch("/{checklist_id}/status")
async def update_item_status(...):
    try:
        result = service.update_item_status(...)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 🧪 测试策略

### 前端测试
- **单元测试**: Store 方法测试
- **集成测试**: API Service 测试
- **E2E 测试**: 用户流程测试

### 后端测试
- **单元测试**: Service 层方法
- **集成测试**: API 端点测试（已完成）
- **性能测试**: 并发请求测试

---

## 📈 扩展性

### 未来功能
1. **多用户支持**: 添加用户认证
2. **清单分享**: 导出/导入功能
3. **提醒功能**: Email/Push 通知
4. **协作功能**: 多人共享清单
5. **分析功能**: 完成率统计

---

## 🎯 最佳实践

### 1. 类型安全
所有 API 调用都有完整的 TypeScript 类型定义

### 2. 错误边界
每个异步操作都有 try-catch 包裹

### 3. 用户反馈
所有操作都有加载状态和结果提示

### 4. 渐进增强
API 失败时自动降级到本地模式

### 5. 代码复用
Service 层封装复用逻辑，组件保持简洁

---

## 📚 相关文档

- [API 集成指南](./CHECKLIST_INTEGRATION.md)
- [后端 API 文档](../Backend/CHECKLIST_API.md)
- [快速开始](../Backend/CHECKLIST_QUICKSTART.md)

---

**架构设计完成！** 🎉

这个架构提供了：
- ✅ 清晰的分层结构
- ✅ 类型安全
- ✅ 错误处理
- ✅ 性能优化
- ✅ 可扩展性
