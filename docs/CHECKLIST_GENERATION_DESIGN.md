# ⚠️ DEPRECATED - See English Version

**This document is in Chinese and is deprecated.**

**Please refer to the English version**: [docs/CHECKLIST_GENERATION_SYSTEM.md](docs/CHECKLIST_GENERATION_SYSTEM.md)

**Note**: This project now focuses exclusively on **Australian individual tax returns**. All US tax references have been removed.

---

# 📋 Checklist 生成系统设计方案 (DEPRECATED)

## 📐 系统架构概览

## Overview
always follow `CODING_RULES.md`
### 核心设计理念

1. **一个 Session → 最多一个 Checklist**
   - 每个会话生成一次 checklist
   - 可以更新现有 checklist
   - 支持重新生成（覆盖）

2. **多模式统一**
   - Free Chat 模式：从对话历史提取信息
   - Guided Chat 模式：从结构化问答提取
   - Quick Generate 模式：用户直接填写表单

3. **渐进式信息收集**
   - 用户可以通过多轮对话补充信息
   - 系统自动提取和更新 `extracted_identity`
   - 达到阈值后提示生成 checklist

---

## 🗄️ 数据库设计

### 现有表结构（已实现）

```sql
-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    full_name VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP
);

-- 会话表
CREATE TABLE chat_sessions (
    id INTEGER PRIMARY KEY,
    session_id VARCHAR UNIQUE NOT NULL,  -- UUID
    user_id INTEGER REFERENCES users(id),
    title VARCHAR,
    conversation_history JSON,  -- [{"role": "user|assistant", "content": "..."}]
    extracted_identity JSON,    -- ChecklistIdentityInfo as dict
    checklist_id INTEGER REFERENCES checklists(id),
    checklist_generated BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Checklist 表
CREATE TABLE checklists (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    identity_info JSON,         -- ChecklistIdentityInfo
    checklist_json JSON,        -- [ChecklistItem]
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 关系说明

```
User (1) ─────< (N) ChatSession
                        │
                        │ (1:1 optional)
                        ▼
                    Checklist
```

- **User → ChatSessions**: 一对多（一个用户可以有多个会话）
- **ChatSession → Checklist**: 一对零或一（一个会话最多一个 checklist）

---

## 🔄 业务流程

### 流程 1: Free Chat 模式 → 生成 Checklist

```
┌─────────────────────────────────────────────────────────────┐
│  1. 用户发送消息                                               │
│     "I'm married filing jointly with 2 kids"                 │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Backend 处理                                              │
│     • 保存消息到 conversation_history                         │
│     • LLM 分析整个对话历史                                     │
│     • 提取/更新 extracted_identity                            │
│     • 计算完成度 (completion_percentage)                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Frontend 显示进度                                          │
│     • 显示信息完成度: 60%                                      │
│     • 已提取信息标签: 📊 Married, 👶 2 Kids                   │
│     • 显示 "Generate Checklist" 按钮 (≥60% 时激活)            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  4. 用户点击 "Generate Checklist"                             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Backend 生成 Checklist                                    │
│     POST /api/checklist/generate-from-session                 │
│     {                                                         │
│       "session_id": "uuid",                                   │
│       "user_id": 1                                            │
│     }                                                         │
│                                                               │
│     • 获取 session.extracted_identity                         │
│     • 调用 LLM 生成个性化 checklist                            │
│     • 创建 Checklist 记录                                      │
│     • 更新 session.checklist_id + checklist_generated=true    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Frontend 显示 Checklist                                   │
│     • 跳转到 /checklist 页面                                   │
│     • 显示生成的任务清单                                        │
│     • 支持状态切换、添加笔记等                                  │
└─────────────────────────────────────────────────────────────┘
```

### 流程 2: 更新现有 Checklist

```
┌─────────────────────────────────────────────────────────────┐
│  用户继续对话，补充新信息                                       │
│  "Actually, I also have rental income"                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend 检测到重要信息变化                                     │
│  • 更新 extracted_identity                                    │
│  • 检查 checklist_generated == true                           │
│  • 提示用户: "检测到新信息，是否更新 checklist?"                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│  用户选择:                                                     │
│  A. 更新 checklist → 追加新项目                                │
│  B. 重新生成 checklist → 完全重新生成                          │
│  C. 忽略 → 保持现有 checklist                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Backend 实现

### 1. 新增 API 端点

#### `POST /api/checklist/generate-from-session`

从会话生成 checklist：

```python
# Backend/app/api/routers/checklist.py

@router.post("/generate-from-session")
async def generate_checklist_from_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    service: ChecklistService = Depends(get_checklist_service)
) -> ChecklistResponse:
    """
    从会话历史生成个性化 checklist。
    
    业务逻辑:
    1. 验证 session 所有权
    2. 检查是否已有 checklist (可选择覆盖或追加)
    3. 从 session.extracted_identity 生成 checklist
    4. 更新 session.checklist_id 和 checklist_generated
    """
    # 获取 session
    session = SessionService.get_session(db, session_id, current_user.id)
    if not session:
        raise HTTPException(404, "Session not found")
    
    # 检查是否已有 checklist
    if session.checklist_generated:
        raise HTTPException(
            400, 
            "Checklist already exists. Use update endpoint to modify."
        )
    
    # 从 extracted_identity 生成
    if not session.extracted_identity:
        raise HTTPException(
            400,
            "Not enough information. Continue chatting to provide more details."
        )
    
    # 生成 checklist
    identity_info = ChecklistIdentityInfo(**session.extracted_identity)
    checklist = await service.generate_and_save_checklist(
        user_id=current_user.id,
        identity_info=identity_info
    )
    
    # 关联到 session
    session.checklist_id = checklist.id
    session.checklist_generated = True
    db.commit()
    
    return checklist
```

#### `PUT /api/checklist/{checklist_id}/regenerate`

重新生成 checklist（基于最新的 session 信息）：

```python
@router.put("/{checklist_id}/regenerate")
async def regenerate_checklist(
    checklist_id: int,
    session_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    service: ChecklistService = Depends(get_checklist_service)
) -> ChecklistResponse:
    """
    重新生成 checklist。
    
    可以基于:
    1. 原有 identity_info (不传 session_id)
    2. 更新后的 session.extracted_identity (传 session_id)
    """
    # 获取现有 checklist
    existing = service.get_checklist(checklist_id, current_user.id)
    if not existing:
        raise HTTPException(404, "Checklist not found")
    
    # 决定使用哪个 identity_info
    if session_id:
        session = SessionService.get_session(db, session_id, current_user.id)
        if session and session.extracted_identity:
            identity_info = ChecklistIdentityInfo(**session.extracted_identity)
        else:
            identity_info = existing.identity_info
    else:
        identity_info = existing.identity_info
    
    # 重新生成
    new_items = await LLMService.generate_tax_checklist(identity_info)
    
    # 更新数据库
    checklist_model = db.query(Checklist).filter_by(id=checklist_id).first()
    checklist_model.identity_info = identity_info.model_dump()
    checklist_model.checklist_json = new_items
    checklist_model.updated_at = datetime.utcnow()
    db.commit()
    
    return service._to_response(checklist_model)
```

### 2. 身份信息提取服务

#### `app/services/identity_extraction_service.py`

```python
"""
从对话历史提取用户身份信息的服务。
使用 LLM 分析对话内容，提取 ChecklistIdentityInfo。
"""
from typing import List, Dict
from app.schemas.schemas import ChecklistIdentityInfo
from app.services.llm_service import get_llm_service


class IdentityExtractionService:
    """
    从对话历史中提取用户身份信息。
    """
    
    def __init__(self):
        self.llm_service = get_llm_service()
    
    async def extract_identity(
        self, 
        conversation_history: List[Dict[str, str]]
    ) -> tuple[ChecklistIdentityInfo, int]:
        """
        从对话历史提取身份信息。
        
        Returns:
            (identity_info, completion_percentage)
        """
        # 构建 prompt
        messages_text = "\n".join([
            f"{msg['role']}: {msg['content']}" 
            for msg in conversation_history
        ])
        
        prompt = f"""
        Analyze the following conversation and extract tax-related identity information.
        
        Conversation:
        {messages_text}
        
        Extract the following information:
        1. Employment status (employed/self-employed/unemployed/retired)
        2. Income sources (list: salary, investment, rental, business, pension, other)
        3. Has dependents (boolean)
        4. Has investment (boolean)
        5. Has rental property (boolean)
        6. Is first time filer (boolean)
        7. Additional contextual information
        
        Respond in JSON format:
        {{
            "employment_status": "...",
            "income_sources": [...],
            "has_dependents": true/false,
            "has_investment": true/false,
            "has_rental_property": true/false,
            "is_first_time_filer": true/false,
            "additional_info": {{...}},
            "confidence": 0-100  // How confident are you?
        }}
        
        If information is not mentioned, use reasonable defaults or null.
        """
        
        # 调用 LLM
        response = await self.llm_service.generate_response(
            prompt,
            temperature=0.3  # Lower temperature for extraction
        )
        
        # 解析响应
        import json
        data = json.loads(response)
        confidence = data.pop("confidence", 0)
        
        # 转换为 ChecklistIdentityInfo
        identity_info = ChecklistIdentityInfo(**data)
        
        # 计算完成度
        completion_percentage = self._calculate_completion(identity_info)
        
        return identity_info, completion_percentage
    
    def _calculate_completion(self, identity: ChecklistIdentityInfo) -> int:
        """
        计算信息完成度 (0-100)。
        
        必填字段:
        - employment_status (20%)
        - income_sources (20%)
        - has_dependents (15%)
        - has_investment (15%)
        - has_rental_property (15%)
        - is_first_time_filer (15%)
        """
        score = 0
        
        if identity.employment_status and identity.employment_status != "unknown":
            score += 20
        
        if identity.income_sources and len(identity.income_sources) > 0:
            score += 20
        
        if identity.has_dependents is not None:
            score += 15
        
        if identity.has_investment is not None:
            score += 15
        
        if identity.has_rental_property is not None:
            score += 15
        
        if identity.is_first_time_filer is not None:
            score += 15
        
        return score


# Singleton
_identity_extraction_service = None

def get_identity_extraction_service() -> IdentityExtractionService:
    global _identity_extraction_service
    if _identity_extraction_service is None:
        _identity_extraction_service = IdentityExtractionService()
    return _identity_extraction_service
```

### 3. 修改 Chat Streaming 端点

在 `chat.py` 的流式响应完成后，提取身份信息：

```python
# Backend/app/api/routers/chat.py

# Step 4: Save messages to session
if session_obj and current_user:
    from datetime import datetime
    from app.services.identity_extraction_service import get_identity_extraction_service
    
    print(f"[chat.py] Saving messages...")
    
    # ... 保存消息的现有代码 ...
    
    # Step 4.5: Extract identity information
    if not session_obj.checklist_generated:  # 只在未生成 checklist 时提取
        extraction_service = get_identity_extraction_service()
        identity_info, completion_pct = await extraction_service.extract_identity(
            updated_history
        )
        
        # 更新 session
        session_obj.extracted_identity = identity_info.model_dump()
        print(f"[chat.py] Identity extraction: {completion_pct}% complete")
    
    db.commit()
```

---

## 🎨 Frontend 实现

### 1. Session Context 增强

更新 `useSession.ts` 返回 checklist 相关状态：

```typescript
// Frontend/src/hooks/useSession.ts

export interface UseSessionReturn {
  // ... 现有字段 ...
  
  // Checklist 相关
  canGenerateChecklist: boolean;         // completion_percentage >= 60%
  hasChecklist: boolean;                 // checklist_generated
  checklistId: number | null;            // checklist_id
  
  // 新方法
  generateChecklist: () => Promise<ChecklistResponse | null>;
  regenerateChecklist: () => Promise<ChecklistResponse | null>;
}
```

### 2. Smart Generate Button 组件

```typescript
// Frontend/src/components/chat/SmartGenerateButton.tsx

export default function SmartGenerateButton({ variant }: Props) {
  const {
    session,
    completionPercentage,
    canGenerateChecklist,
    hasChecklist,
    generateChecklist,
    regenerateChecklist
  } = useSessionContext();
  
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  if (!session) return null;
  
  const handleGenerate = async () => {
    setLoading(true);
    try {
      const checklist = await generateChecklist();
      if (checklist) {
        Modal.success({
          title: 'Checklist Generated!',
          content: `${checklist.items.length} tasks created for you.`,
          onOk: () => router.push('/checklist')
        });
      }
    } catch (error) {
      message.error('Failed to generate checklist');
    } finally {
      setLoading(false);
    }
  };
  
  if (hasChecklist) {
    // 已经有 checklist，显示查看按钮
    return (
      <Button
        type="default"
        icon={<CheckCircleOutlined />}
        onClick={() => router.push('/checklist')}
      >
        View Checklist
      </Button>
    );
  }
  
  if (!canGenerateChecklist) {
    // 信息不足，显示进度提示
    return (
      <Tooltip title={`Provide more information (${completionPercentage}% complete)`}>
        <Button disabled icon={<FileTextOutlined />}>
          Generate Checklist ({completionPercentage}%)
        </Button>
      </Tooltip>
    );
  }
  
  // 可以生成，显示激活按钮
  return (
    <Button
      type="primary"
      size="large"
      icon={<ThunderboltOutlined />}
      loading={loading}
      onClick={handleGenerate}
    >
      Generate Checklist ({completionPercentage}%)
    </Button>
  );
}
```

### 3. Checklist 页面增强

```typescript
// Frontend/src/app/checklist/page.tsx

export default function ChecklistPage() {
  const [checklist, setChecklist] = useState<ChecklistResponse | null>(null);
  const { session } = useSessionContext();
  const router = useRouter();
  
  useEffect(() => {
    // 从 session 加载 checklist
    if (session?.checklist_id) {
      loadChecklist(session.checklist_id);
    }
  }, [session]);
  
  const handleRegenerate = async () => {
    Modal.confirm({
      title: 'Regenerate Checklist?',
      content: 'This will create a new checklist based on your latest conversation.',
      onOk: async () => {
        const newChecklist = await regenerateChecklist(checklist.id, session.session_id);
        setChecklist(newChecklist);
        message.success('Checklist regenerated!');
      }
    });
  };
  
  return (
    <div>
      <PageHeader
        title="Tax Preparation Checklist"
        extra={[
          <Button key="chat" onClick={() => router.push('/chat')}>
            Back to Chat
          </Button>,
          <Button key="regen" onClick={handleRegenerate}>
            Regenerate
          </Button>
        ]}
      />
      
      {/* Checklist items */}
      <ChecklistView checklist={checklist} />
    </div>
  );
}
```

---

## 🎯 用户体验流程

### 场景 1: 从零开始

1. **用户**: 打开应用，点击 "Free Chat"
2. **系统**: 创建新的 session
3. **用户**: "I'm married and have 2 kids"
4. **系统**: 
   - AI 回复
   - 提取信息 → `extracted_identity`
   - 显示进度条: "Information: 40% complete"
5. **用户**: "I also have rental income from an apartment"
6. **系统**:
   - 更新 `extracted_identity`
   - 进度条更新: "Information: 65% complete"
   - ✨ "Generate Checklist" 按钮亮起
7. **用户**: 点击 "Generate Checklist"
8. **系统**:
   - 调用 LLM 生成个性化 checklist
   - 跳转到 checklist 页面
   - 显示 18 个任务

### 场景 2: 补充信息后更新

1. **用户**: 在 chat 中继续对话 "I forgot to mention I have stock investments"
2. **系统**: 
   - 检测到 `checklist_generated = true`
   - 提示: "💡 New information detected! Update your checklist?"
3. **用户**: 点击 "Update"
4. **系统**:
   - 选项 A: "Add new items" (追加)
   - 选项 B: "Regenerate" (重新生成)
5. **用户**: 选择 "Add new items"
6. **系统**: 追加 3 个投资相关的任务

---

## 📊 数据流图

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ Sends Message
       ▼
┌─────────────────┐
│  Chat Session   │◄─────────┐
│  - conversation │          │
│  - extracted_   │          │
│    identity     │          │
└────────┬────────┘          │
         │                   │
         │ Generate          │ Update
         ▼                   │
┌─────────────────┐          │
│   Checklist     │──────────┘
│   - items       │
│   - status      │
└─────────────────┘
```

---

## 🔧 配置与调优

### LLM Prompt 配置

```python
# Backend/app/core/prompts.py

IDENTITY_EXTRACTION_PROMPT = """
Analyze the conversation and extract tax-related information.

Required fields:
- employment_status: employed | self-employed | unemployed | retired
- income_sources: array of [salary, investment, rental, business, pension, other]
- has_dependents: boolean
- has_investment: boolean
- has_rental_property: boolean
- is_first_time_filer: boolean

Additional context:
- location (state/country)
- industry
- special circumstances

Confidence threshold: 60% to suggest checklist generation.
"""

CHECKLIST_GENERATION_PROMPT = """
Generate a personalized tax preparation checklist based on:

Identity: {identity_info}

Create 15-25 actionable tasks categorized as:
- Documents (gather required forms)
- Records (organize financial records)
- Calculations (prepare calculations)
- Review (final checks before filing)

Each task should have:
- Title (brief, actionable)
- Description (specific instructions)
- Priority (high/medium/low)
- Estimated time
"""
```

---

## 🚀 实施步骤

### Phase 1: Backend 基础 (2-3 天)

1. ✅ 创建 `IdentityExtractionService`
2. ✅ 新增 `/api/checklist/generate-from-session` endpoint
3. ✅ 修改 chat streaming 端点，添加身份提取逻辑
4. ✅ 编写单元测试

### Phase 2: Frontend 集成 (2 天)

1. ✅ 更新 `useSession` hook
2. ✅ 创建 `SmartGenerateButton` 组件
3. ✅ 更新 checklist 页面
4. ✅ 添加进度显示组件

### Phase 3: 优化与测试 (1-2 天)

1. ✅ E2E 测试完整流程
2. ✅ 优化 LLM prompts
3. ✅ 性能优化
4. ✅ 错误处理完善

---

## ❓ FAQ

### Q1: 一个用户可以有多个 checklist 吗？

**A**: 可以有多个 **session**，每个 session 可以生成一个 checklist。

- 场景 1: 2024 年报税 → Session A → Checklist A
- 场景 2: 2025 年报税 → Session B → Checklist B

### Q2: 如何处理 checklist 更新？

**A**: 三种策略：

1. **追加模式**: 保留现有项目，添加新项目
2. **重新生成**: 完全重新生成（推荐）
3. **智能合并**: 保留已完成的项目，更新其他项目

### Q3: 不同模式生成的 checklist 有区别吗？

**A**: 核心逻辑相同，只是信息来源不同：

| 模式 | 信息来源 | 特点 |
|------|---------|------|
| Free Chat | LLM 提取对话 | 灵活，需多轮对话 |
| Guided Chat | 结构化问答 | 精确，引导式 |
| Quick Generate | 用户表单 | 快速，直接 |

所有模式最终都生成相同格式的 `ChecklistIdentityInfo` → 统一的 checklist 生成逻辑。

### Q4: 如何保证提取的信息准确？

**A**: 多重保障：

1. **LLM 温度参数**: 使用低温度 (0.3) 提高稳定性
2. **置信度评分**: LLM 返回 confidence 分数
3. **用户确认**: 生成前显示提取的信息，让用户确认
4. **可编辑**: Checklist 生成后用户可以编辑

---

## 📈 未来扩展

### 1. AI 辅助更新

当用户提供新信息时，AI 自动建议要追加的任务：

```
User: "I started freelancing this year"
AI: "💡 I'll add 3 tasks for self-employment:
     1. Gather 1099 forms
     2. Calculate estimated taxes
     3. Track business expenses"
```

### 2. 进度跟踪

- 显示 checklist 完成百分比
- 预估完成时间
- 发送提醒通知

### 3. 协作功能

- 分享 checklist 给会计师
- 多人协作完成任务

### 4. 历史对比

- 对比不同年度的 checklist
- 自动复用去年的数据

---

## ✅ 总结

这个设计方案具有以下优势：

1. **统一架构**: 所有模式共享同一套 checklist 生成逻辑
2. **渐进式**: 用户可以逐步提供信息
3. **灵活更新**: 支持追加和重新生成
4. **用户友好**: 清晰的进度显示和操作提示
5. **可扩展**: 易于添加新的模式和功能

现在可以开始实施了！需要我帮你创建具体的代码文件吗？
