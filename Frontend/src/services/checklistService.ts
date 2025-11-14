/**
 * Checklist API Service
 * Encapsulates all checklist-related API calls
 */

// API base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ==================== Type Definitions ====================

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

// ==================== API Functions ====================

/**
 * Generate personalized checklist
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
 * Get single checklist (authenticated)
 * GET /api/checklist/{id}
 */
export async function getChecklist(
  checklistId: number,
  token: string
): Promise<ChecklistResponse> {
  if (!token) {
    throw new Error('Authentication token is required')
  }

  const response = await fetch(
    `${API_BASE_URL}/api/checklist/${checklistId}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `Failed to get checklist: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get all checklists for current authenticated user
 * GET /api/checklist/my-checklists
 */
export async function getUserChecklists(token: string): Promise<ChecklistResponse[]> {
  if (!token) {
    throw new Error('Authentication token is required')
  }

  const response = await fetch(`${API_BASE_URL}/api/checklist/my-checklists`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
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
 * Update checklist item status
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
 * Delete checklist
 * DELETE /api/checklist/{id}
 * Requires authentication token
 */
export async function deleteChecklist(
  checklistId: number,
  token: string
): Promise<void> {
  if (!token) {
    throw new Error('Authentication token is required')
  }

  const response = await fetch(
    `${API_BASE_URL}/api/checklist/${checklistId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `Failed to delete checklist: ${response.statusText}`)
  }

  // 204 No Content - no response body
  return
}

// ==================== Helper Functions ====================

/**
 * Convert backend ChecklistItem to frontend Task format
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
 * Example: Construct an identity information object
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
