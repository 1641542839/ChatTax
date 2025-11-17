# Guided Mode Implementation Summary

## 问题描述
用户报告 Guided Mode 出现 404 错误：
```
Get question error: Error: Failed to get question
"GET /api/guided-chat/9d3337d4-7eb7-488b-9c81-83b819452e05/initial HTTP/1.1" 404 Not Found
```

## 根本原因
**后端路由文件缺失**：`Backend/app/api/routers/guided_chat.py` 文件不存在，导致前端调用的所有 `/api/guided-chat/*` 端点都返回 404。

## 解决方案

### 1. 创建 Guided Chat 路由文件
**文件**：`Backend/app/api/routers/guided_chat.py`

**实现的端点**：

#### GET `/api/guided-chat/{session_id}/initial`
- 获取引导对话的第一个问题
- 验证 session 存在且属于当前用户
- 调用 `GuidedChecklistService.get_initial_question()` 返回第一个问题（residency status）

#### GET `/api/guided-chat/{session_id}/next?current_phase={phase}`
- 基于当前阶段获取下一个问题
- 从 session.context 中读取已收集的信息
- 调用 `GuidedChecklistService.get_next_question()` 返回下一阶段问题

#### POST `/api/guided-chat/{session_id}/answer`
- 提交用户对当前问题的回答
- 调用 `GuidedChecklistService.parse_answer()` 解析回答
- 将解析后的数据存储到 session.context 的 collected_info 中
- 返回成功状态和可能的 follow-up 问题

### 2. 注册路由到 main.py
**文件**：`Backend/main.py`

**修改**：
```python
# 1. Import the router
from app.api.routers import auth, chat, query, checklist, session, guided_chat

# 2. Include the router
app.include_router(guided_chat.router)  # Already has /api prefix in router definition
```

### 3. 实现细节

#### Session Context 数据结构
```json
{
  "collected_info": {
    "residency_status": "resident",
    "employment_type": "employed",
    "has_dependents": false,
    "annual_income_range": "45000-120000",
    "owns_home": true,
    "has_investments": true,
    "has_rental_property": false,
    "has_foreign_income": false,
    "has_super_contributions": true,
    "has_work_expenses": true,
    "has_private_health": true,
    "has_hecs_help": false,
    "has_donations": true
  },
  "last_phase": "additional"
}
```

#### Question Flow (8 phases)
1. **residency** - Residency status (resident/foreign/WHM)
2. **employment** - Employment type (employed/self-employed/contractor/retired/student/unemployed)
3. **dependents** - Has dependents? (yes/no) + number if yes
4. **income** - Annual income range (5 brackets)
5. **home** - Owns home or renting
6. **investments** - Has investments (shares/crypto/funds)
7. **rental** - Has rental property income
8. **additional** - Multi-select: foreign income, super, work expenses, health insurance, HECS, donations
9. **complete** - Ready to generate checklist

#### Answer Parsing Logic
- **Single select**: Maps user input to predefined option values
- **Multi-select**: Extracts multiple selections from comma-separated input
- **Number validation**: Extracts numbers for fields like num_dependents
- **Follow-up questions**: Triggered when certain conditions met (e.g., has_dependents=true → ask number)

### 4. 依赖的现有服务

#### GuidedChecklistService (已存在)
**文件**：`Backend/app/services/guided_checklist_service.py`

**关键方法**（都是 static）：
- `get_initial_question()` - 返回第一个问题
- `get_next_question(current_phase, collected_info)` - 返回下一个问题
- `parse_answer(phase, answer, collected_info)` - 解析用户回答
- `is_conversation_complete(collected_info)` - 检查是否收集足够信息

## 测试验证

### 测试脚本
**文件**：`Backend/test_guided_chat.py`

**测试流程**：
1. ✅ 用户认证（login/register）
2. ✅ 创建 chat session
3. ✅ 获取初始问题（GET /initial）
4. ✅ 提交回答（POST /answer）
5. ✅ 获取下一个问题（GET /next）

### 运行测试
```powershell
cd Backend
python test_guided_chat.py
```

**预期输出**：
```
==================================================
1. Testing Authentication...
==================================================
✅ Login successful! Token: eyJhbGciOiJIUzI1NiIsIn...

==================================================
2. Creating Chat Session...
==================================================
✅ Session created: 9d3337d4-7eb7-488b-9c81-83b819452e05

==================================================
3. Getting Initial Question...
==================================================
✅ Got initial question!
   Phase: residency
   Question: Let me help you generate a personalized Australian tax return checklist! First...
   Progress: 1/8 (12.5%)

==================================================
4. Submitting Answer...
==================================================
✅ Answer submitted!
   Status: success
   Message: Answer stored successfully

==================================================
5. Getting Next Question...
==================================================
✅ Got next question!
   Phase: employment
   Question: What is your primary employment type?...
   Progress: 2/8 (25.0%)

==================================================
✅ All Guided Chat Endpoints Working!
==================================================
```

## 前端集成

### 前端页面
**文件**：`Frontend/src/app/checklist/guided/page.tsx`

**流程**：
1. 组件挂载时调用 `initializeSession()` 创建 session
2. 调用 GET `/api/guided-chat/{session_id}/initial` 获取第一个问题
3. 用户选择答案后调用 POST `/api/guided-chat/{session_id}/answer` 提交
4. 如果未完成，调用 GET `/api/guided-chat/{session_id}/next` 获取下一题
5. 重复步骤 3-4 直到 phase="complete"
6. 调用 POST `/api/checklist/generate` 生成 checklist（generation_mode="guided_chat"）

### 数据流
```
Frontend                     Backend
   |                            |
   |-- POST /api/sessions ----->|  Create session
   |<--- session_id ------------|
   |                            |
   |-- GET /initial ----------->|  Get first question
   |<--- question (residency) --|
   |                            |
   |-- POST /answer ----------->|  Store: residency_status="resident"
   |<--- success ---------------|
   |                            |
   |-- GET /next?phase=... ---->|  Get next question based on phase
   |<--- question (employment) -|
   |                            |
   ... (repeat 8 times) ...     |
   |                            |
   |-- POST /answer ----------->|  Store: additional items
   |<--- success, complete -----|
   |                            |
   |-- POST /checklist/generate |  Generate checklist from collected_info
   |    (mode=guided_chat) ---->|
   |<--- checklist -------------|
```

## 与其他模式的集成

### ChecklistService.generate_from_conversation()
**文件**：`Backend/app/services/checklist_service.py`

Guided Mode 完成后，调用 checklist generation 时会：
1. 从 session.context 读取 collected_info
2. 不需要 LLM 提取（信息已结构化）
3. 直接使用 collected_info 作为 identity_info
4. 调用 `LLMService.generate_tax_checklist()` 生成个性化 checklist

**关键区别**：
- **Form Mode (Path 1)**: 前端直接发送结构化数据 → ChecklistService
- **Guided Mode (Path 2)**: 引导问答收集数据到 session.context → 读取 → ChecklistService
- **Free Chat Mode (Path 3)**: 自然对话 → IdentityExtractorService 提取 → ChecklistService

所有三种模式最终都使用相同的 `ChecklistIdentityInfo` schema 和相同的 LLM prompt。

## 状态总结

### ✅ 已完成
- [x] 创建 `guided_chat.py` 路由文件
- [x] 实现 3 个必需端点（initial, next, answer）
- [x] 在 main.py 中注册路由
- [x] Session 验证和用户权限检查
- [x] Context 存储和读取逻辑
- [x] 答案解析和数据转换
- [x] 进度跟踪（current/total/percentage）
- [x] 创建测试脚本

### 🔄 需要用户操作
- [ ] 重启后端服务器以加载新路由
- [ ] 运行测试脚本验证端点
- [ ] 在前端测试完整 Guided Mode 流程

### 📝 后续优化建议（可选）
- [ ] 添加答案验证规则（例如检查 employment_type 是否在允许值内）
- [ ] 实现"返回上一题"功能（需要存储问题历史）
- [ ] 添加问题跳过逻辑（例如 unemployed 可能跳过某些问题）
- [ ] 考虑添加智能问题分支（基于之前答案动态调整后续问题）
- [ ] 实现会话超时和自动清理
- [ ] 添加答案修改功能（允许用户返回修改之前的答案）

## 启动步骤

### 1. 重启后端
```powershell
cd Backend

# 停止现有进程
Get-Process | Where-Object {$_.ProcessName -like "*python*" -or $_.ProcessName -like "*uvicorn*"} | Stop-Process -Force

# 启动服务器
python -m uvicorn main:app --reload --port 8000
```

### 2. 测试端点
```powershell
python test_guided_chat.py
```

### 3. 前端测试
1. 访问 http://localhost:3000/checklist/guided
2. 应该能看到第一个问题而不是 404 错误
3. 回答问题并观察进度条
4. 完成所有 8 个问题
5. 查看生成的个性化 checklist

## 错误排查

如果仍然出现 404：
1. 检查后端是否重启成功
2. 访问 http://localhost:8000/docs 查看 Swagger UI
3. 确认 `/api/guided-chat/{session_id}/initial` 端点存在
4. 检查浏览器控制台的完整错误信息
5. 查看后端日志中的路由注册信息

如果出现认证错误：
1. 确保前端 localStorage 中有 access_token
2. 检查 token 是否过期（JWT exp claim）
3. 尝试重新登录

如果答案解析错误：
1. 查看后端日志中 parse_answer 的输出
2. 确认用户输入是否在 options 映射中
3. 检查 session.context 中的 collected_info 结构
