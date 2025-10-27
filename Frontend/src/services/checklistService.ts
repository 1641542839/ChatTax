/**
 * Checklist API Service
 * 封装所有与 checklist 相关的 API 调用
 */

// API 基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ==================== 类型定义 ====================

export interface ChecklistIdentityInfo {
  employment_status: 'employed' | 'self_employed' | 'unemployed' | 'retired'
  income_sources: string[] // ['salary', 'investment', 'rental', 'pension', 'other']
  has_dependents: boolean
  has_investment: boolean
  has_rental_property: boolean
  is_first_time_filer?: boolean
  additional_info?: Record<string, any>
}

export interface ChecklistItem {
  id: string
  title: string
  description: string
  category: string
  priority: 'high' | 'medium' | 'low'
  status: 'todo' | 'doing' | 'done'
  estimated_time?: string
}

export interface ChecklistResponse {
  id: number
  user_id: number
  identity_info: ChecklistIdentityInfo
  items: ChecklistItem[]
  created_at: string
  updated_at: string
}

export interface GenerateChecklistRequest {
  user_id: number
  identity_info: ChecklistIdentityInfo
}

export interface UpdateItemStatusRequest {
  item_id: string
  status: 'todo' | 'doing' | 'done'
}

// ==================== API 函数 ====================

/**
 * 生成个性化清单
 * POST /api/checklist/generate
 */
export async function generateChecklist(
  request: GenerateChecklistRequest
): Promise<ChecklistResponse> {
  const response = await fetch(`${API_BASE_URL}/api/checklist/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `Failed to generate checklist: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 获取单个清单
 * GET /api/checklist/{id}
 */
export async function getChecklist(
  checklistId: number,
  userId: number
): Promise<ChecklistResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/checklist/${checklistId}?user_id=${userId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `Failed to get checklist: ${response.statusText}`)
  }

  return response.json()
}

/**
 * 获取用户的所有清单
 * GET /api/checklist/user/{user_id}
 */
export async function getUserChecklists(userId: number): Promise<ChecklistResponse[]> {
  const response = await fetch(`${API_BASE_URL}/api/checklist/user/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      error.detail || `Failed to get user checklists: ${response.statusText}`
    )
  }

  return response.json()
}

/**
 * 更新清单项状态
 * PATCH /api/checklist/{id}/status
 */
export async function updateItemStatus(
  checklistId: number,
  userId: number,
  request: UpdateItemStatusRequest
): Promise<ChecklistResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/checklist/${checklistId}/status?user_id=${userId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      error.detail || `Failed to update item status: ${response.statusText}`
    )
  }

  return response.json()
}

/**
 * 删除清单
 * DELETE /api/checklist/{id}
 */
export async function deleteChecklist(
  checklistId: number,
  userId: number
): Promise<{ message: string }> {
  const response = await fetch(
    `${API_BASE_URL}/api/checklist/${checklistId}?user_id=${userId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `Failed to delete checklist: ${response.statusText}`)
  }

  return response.json()
}

// ==================== 辅助函数 ====================

/**
 * 将后端的 ChecklistItem 转换为前端的 Task 格式
 */
export function convertChecklistItemToTask(item: ChecklistItem) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    status: item.status,
    priority: item.priority,
    category: item.category,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * 示例：构造一个身份信息对象
 */
export function createIdentityInfo(
  employmentStatus: ChecklistIdentityInfo['employment_status'],
  options: {
    incomeSources?: string[]
    hasDependents?: boolean
    hasInvestment?: boolean
    hasRentalProperty?: boolean
    isFirstTimeFiler?: boolean
    additionalInfo?: Record<string, any>
  } = {}
): ChecklistIdentityInfo {
  return {
    employment_status: employmentStatus,
    income_sources: options.incomeSources || ['salary'],
    has_dependents: options.hasDependents ?? false,
    has_investment: options.hasInvestment ?? false,
    has_rental_property: options.hasRentalProperty ?? false,
    is_first_time_filer: options.isFirstTimeFiler ?? false,
    additional_info: options.additionalInfo,
  }
}
