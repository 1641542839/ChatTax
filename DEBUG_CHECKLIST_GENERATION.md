# Debug Checklist Generation Issue

## Issue Description
用户报告无论选择什么选项，生成的 checklist 都看起来一样。需要调试整个数据流程，从前端表单到后端 LLM 调用。

## Debugging Steps

### 1. 重启后端服务器
```powershell
cd Backend
python main.py
```

### 2. 打开前端开发控制台
1. 打开浏览器的开发者工具 (F12)
2. 切换到 Console 标签
3. 导航到 http://localhost:3000/checklist/generate

### 3. 测试两种不同的情况

#### 测试 A: 简单情况 (Simple Scenario)
填写表单:
- Employment Status: **Employed (PAYG Employee)** ✅
- Income Sources: 只选 **Salary/Wages** ✅
- Has Dependents: **不勾选** ❌
- Has Investments: **不勾选** ❌
- Has Rental Property: **不勾选** ❌
- First Time Filer: **勾选** ✅

点击生成，观察:
- **前端控制台** (浏览器):
  - 应该看到 `📝 Form values submitted`
  - 应该看到 `🔍 Identity info to be sent`
  - 应该看到 `📤 Sending identityInfo to API`
  - 应该看到 `📥 Received checklist from API`

- **后端控制台** (PowerShell):
  - 应该看到 `📥 Received identity_info from frontend`
  - 应该看到 `🔍 ChecklistService - identity_info to be sent to LLM`
  - 应该看到 `🤖 LLMService - Sending prompt to OpenAI` 显示所有参数
  - 应该看到 `📤 LLMService - Received response from OpenAI`

记录生成的 checklist 项目数量: ___________

#### 测试 B: 复杂情况 (Complex Scenario)
填写表单:
- Employment Status: **Self-Employed / Sole Trader** ✅
- Income Sources: 选择多个 **Business Income + Investment Income + Rental Property** ✅✅✅
- Has Dependents: **勾选**，数量: **2** ✅
- Has Investments: **勾选** ✅
- Has Rental Property: **勾选**，数量: **1** ✅
- First Time Filer: **不勾选** ❌
- Home Office: **勾选** ✅
- Charity Donations: **勾选** ✅

点击生成，观察相同的日志。

记录生成的 checklist 项目数量: ___________

### 4. 对比结果

#### 期望结果
- 测试 A (简单情况): 应该生成 **5-8 个项目**
- 测试 B (复杂情况): 应该生成 **12-15 个项目**

#### 项目内容差异
测试 A 应该包含:
- Payment summary from employer
- Basic PAYG deductions
- myGov account setup
- Basic lodgement guide

测试 B 应该包含:
- Business income records (ABN, invoices)
- Investment documentation (dividend statements, capital gains)
- Rental property expenses (interest, maintenance, depreciation)
- Dependent-related offsets
- Home office deduction calculations
- Charity donation receipts

### 5. 检查调试日志

#### 前端检查点
```javascript
// 在 Console 中查找:
📝 Form values submitted: {
  employmentStatus: "...",
  incomeSources: [...],
  hasDependents: true/false,
  hasInvestment: true/false,
  ...
}

🔍 Identity info to be sent: {
  employment_status: "...",
  income_sources: [...],
  has_dependents: true/false,
  ...
}
```

**问题诊断**:
- ❌ 如果所有值都是默认值 (employed, ["salary"], all false)，说明表单没有正确获取用户输入
- ❌ 如果 Checkbox 的值总是 false，可能是 `valuePropName="checked"` 设置有问题

#### 后端检查点
```python
# 在 PowerShell 中查找:
🔍 ChecklistService - identity_info to be sent to LLM:
  - employment_status: employed
  - income_sources: ['salary']
  - has_dependents: False
  - has_investment: False
  - has_rental_property: False
  ...

🤖 LLMService - Sending prompt to OpenAI:
   Employment Status: employed
   Income Sources: salary
   Has Dependents: No
   Has Investment: No
   ...
```

**问题诊断**:
- ❌ 如果两次测试的参数完全一样，说明前端没有正确传递数据
- ❌ 如果参数正确但生成的 checklist 一样，说明 LLM prompt 可能没有正确使用这些参数

#### LLM Response 检查
```python
# 查找:
📤 LLMService - Received response from OpenAI (first 500 chars):
[
  {
    "id": "doc_001",
    "title": "...",
    ...
  },
  ...
]
```

**问题诊断**:
- ❌ 如果两次测试返回的 JSON 完全一样，说明 OpenAI 没有根据不同参数生成个性化内容
- ✅ 如果返回的 JSON 不同，说明个性化工作正常，可能是前端显示的问题

## Possible Issues

### Issue 1: Form Values Not Captured
**症状**: 前端 console 显示的 `values` 总是默认值

**原因**: Ant Design Form 的 Checkbox 组件可能没有正确绑定

**解决方案**: 检查 `Form.Item` 的 `name` 和 `valuePropName="checked"` 配置

### Issue 2: API Request Body Incorrect
**症状**: 后端收到的 `identity_info` 总是默认值

**原因**: `createIdentityInfo` 函数使用了 `|| false`，即使 checkbox 未勾选也会设为 false

**解决方案**: 确认表单提交的 `values` 对象包含正确的 Boolean 值

### Issue 3: LLM Not Using Parameters
**症状**: OpenAI 返回的 checklist 不管参数如何都一样

**原因**: 
- OpenAI temperature 设置太低 (当前 0.3)
- Prompt 没有足够强调差异化
- 可能需要更明确的指令

**解决方案**: 
- 提高 temperature 到 0.5-0.7
- 增强 prompt 中关于动态生成的指令
- 添加更多示例来引导 LLM

### Issue 4: Frontend Cache Issue
**症状**: 即使后端返回不同的 checklist，前端显示的还是旧的

**原因**: Zustand store 可能缓存了旧数据

**解决方案**: 
- 清除浏览器 localStorage
- 重启前端开发服务器
- 检查 checklistStore 的 state 更新逻辑

## Test Results (Nov 14, 2025)

### ✅ Root Cause Found

经过测试，发现 **LLM 确实生成了个性化的 checklist**：
- **测试 A** (简单情况): 7 个项目，focus on employed/PAYG employee
- **测试 B** (复杂情况): **11 个项目**，包含 self-employment, rental property, dependents 等

**实际问题**：
1. ❌ 生成后跳转到 `/checklist`（无 ID），导致可能加载旧数据
2. ❌ `loadUserChecklistsFromAPI` 使用了错误的数组索引（应该用 `[0]` 而不是 `[length-1]`）

### ✅ 修复方案

已修复以下问题：

1. **Frontend/src/app/checklist/generate/page.tsx**:
   - 生成后使用返回的 `checklistId` 跳转到 `/checklist?id={id}`
   - 如果没有 ID，fallback 到 `/checklist`

2. **Frontend/src/store/checklistStore.ts**:
   - 修改 `loadUserChecklistsFromAPI` 使用 `checklists[0]`（后端返回 newest first）

### 📊 验证结果

**数据流程完全正常**：
```
Form (correct values) 
  → createIdentityInfo (correct mapping) 
    → API request (correct body) 
      → Backend ChecklistService (correct params) 
        → LLM Service (correct prompt with all params) 
          → OpenAI (personalized response) ✅
```

**测试 A 日志**:
```
Employment Status: employed
Income Sources: salary
Has Dependents: No
Has Investment: No
Has Rental Property: No
First Time Filer: Yes
→ Generated 7 items (simple scenario)
```

**测试 B 日志**:
```
Employment Status: self_employed
Income Sources: self_employment, investment, rental
Has Dependents: Yes (2 dependents)
Has Investment: Yes
Has Rental Property: Yes (1 property)
First Time Filer: No
Additional: home_office, charity_donations
→ Generated 11 items (complex scenario)
```

## Next Steps

根据调试日志的输出，我们可以定位问题在哪个环节:

1. **如果前端 Form values 就不对** → 修复表单组件配置
2. **如果 API 请求体不对** → 修复 createIdentityInfo 函数或 store
3. **如果后端收到的数据正确但 LLM 返回一样** → 调整 LLM prompt 或 temperature
4. **如果 LLM 返回正确但前端显示一样** → 检查前端 state 管理

**✅ 本次问题已解决**: 是跳转和数组索引的问题，不是 LLM 个性化的问题

## Clean Up After Debugging

调试完成后，可以删除所有 `console.log` 和 `print` 语句:

```bash
# 前端
Frontend/src/app/checklist/generate/page.tsx (line ~85-88, ~108)
Frontend/src/store/checklistStore.ts (line ~204, ~211)

# 后端
Backend/app/api/routers/checklist.py (line ~99)
Backend/app/services/checklist_service.py (line ~69-76)
Backend/app/services/llm_service.py (line ~397-404, ~410-412)
```

或者保留为条件调试（使用环境变量控制）。
