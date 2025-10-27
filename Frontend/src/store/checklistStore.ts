import { create } from 'zustand'
import { nanoid } from 'nanoid'
import * as checklistService from '@/services/checklistService'
import type {
  ChecklistResponse,
  ChecklistIdentityInfo,
  UpdateItemStatusRequest,
} from '@/services/checklistService'

export type TaskStatus = 'todo' | 'doing' | 'done'

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  createdAt: Date
  updatedAt: Date
  priority?: 'high' | 'medium' | 'low'
  category?: string
}

interface ChecklistState {
  tasks: Task[]
  filter: TaskStatus | 'all'
  currentChecklistId: number | null // 当前加载的清单 ID
  isLoading: boolean
  error: string | null

  // 本地操作 Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTaskStatus: (id: string) => void
  setFilter: (filter: TaskStatus | 'all') => void
  getFilteredTasks: () => Task[]
  initializeDefaultTasks: () => void

  // API 集成 Actions
  generateChecklistFromAPI: (
    userId: number,
    identityInfo: ChecklistIdentityInfo
  ) => Promise<void>
  loadChecklistFromAPI: (checklistId: number, userId: number) => Promise<void>
  loadUserChecklistsFromAPI: (userId: number) => Promise<void>
  updateTaskStatusInAPI: (
    itemId: string,
    newStatus: TaskStatus,
    userId: number
  ) => Promise<void>
  deleteChecklistFromAPI: (userId: number) => Promise<void>
}

const defaultTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Gather Payment Summaries',
    description:
      'Collect Payment Summaries from your employers for the financial year, showing your income and tax withheld. If you have multiple employers, collect all summaries.',
    status: 'done',
    priority: 'high',
    category: 'Documents',
  },
  {
    title: 'Prepare Bank Statements',
    description:
      'Collect annual bank statements for all accounts showing interest income, overseas income, etc. This information is important for your tax return.',
    status: 'doing',
    priority: 'high',
    category: 'Documents',
  },
  {
    title: 'Organize Work-Related Expenses',
    description:
      'Collect receipts and documents for work-related expenses such as home office costs, car expenses, professional development, work clothing, etc.',
    status: 'todo',
    priority: 'medium',
    category: 'Deductions',
  },
  {
    title: 'Create myGov Account',
    description:
      'If you don\'t have a myGov account yet, create one and link it to the ATO (Australian Taxation Office). This is necessary for online tax lodgement.',
    status: 'todo',
    priority: 'high',
    category: 'Setup',
  },
  {
    title: 'Prepare Medical Expense Records',
    description:
      'Collect medical expense receipts including private health insurance premiums, prescription medications, dental fees, etc. These may qualify for medical expense offset.',
    status: 'todo',
    priority: 'low',
    category: 'Deductions',
  },
  {
    title: 'Prepare Charitable Donation Receipts',
    description:
      'Collect all donation receipts to registered charities. Only donations to registered DGRs (Deductible Gift Recipients) are tax deductible.',
    status: 'todo',
    priority: 'medium',
    category: 'Deductions',
  },
  {
    title: 'Prepare Superannuation Contribution Info',
    description:
      'Record all Personal Super Contributions. These contributions may qualify for tax concessions.',
    status: 'doing',
    priority: 'medium',
    category: 'Retirement',
  },
  {
    title: 'Check Tax Offset Eligibility',
    description:
      'Check if you qualify for various tax offsets such as Low Income Tax Offset (LITO), Low and Middle Income Tax Offset (LMITO), Family Tax Benefit, etc.',
    status: 'todo',
    priority: 'high',
    category: 'Credits',
  },
]

export const useChecklistStore = create<ChecklistState>((set, get) => ({
  tasks: [],
  filter: 'all',
  currentChecklistId: null,
  isLoading: false,
  error: null,

  // ==================== 本地操作 ====================

  addTask: (task) => {
    const newTask: Task = {
      ...task,
      id: nanoid(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    set((state) => ({
      tasks: [...state.tasks, newTask],
    }))
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates, updatedAt: new Date() } : task
      ),
    }))
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }))
  },

  toggleTaskStatus: (id) => {
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id === id) {
          let newStatus: TaskStatus
          if (task.status === 'todo') newStatus = 'doing'
          else if (task.status === 'doing') newStatus = 'done'
          else newStatus = 'todo'

          return { ...task, status: newStatus, updatedAt: new Date() }
        }
        return task
      }),
    }))
  },

  setFilter: (filter) => {
    set({ filter })
  },

  getFilteredTasks: () => {
    const { tasks, filter } = get()
    if (filter === 'all') return tasks
    return tasks.filter((task) => task.status === filter)
  },

  initializeDefaultTasks: () => {
    const currentTasks = get().tasks
    if (currentTasks.length === 0) {
      const tasksWithIds = defaultTasks.map((task) => ({
        ...task,
        id: nanoid(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
      set({ tasks: tasksWithIds })
    }
  },

  // ==================== API 集成 ====================

  /**
   * 从 API 生成新的个性化清单
   */
  generateChecklistFromAPI: async (userId, identityInfo) => {
    set({ isLoading: true, error: null })
    try {
      const response = await checklistService.generateChecklist({
        user_id: userId,
        identity_info: identityInfo,
      })

      // 转换后端数据为前端格式
      const tasks: Task[] = response.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        status: item.status,
        priority: item.priority,
        category: item.category,
        createdAt: new Date(response.created_at),
        updatedAt: new Date(response.updated_at),
      }))

      set({
        tasks,
        currentChecklistId: response.id,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate checklist',
      })
      throw error
    }
  },

  /**
   * 从 API 加载指定的清单
   */
  loadChecklistFromAPI: async (checklistId, userId) => {
    set({ isLoading: true, error: null })
    try {
      const response = await checklistService.getChecklist(checklistId, userId)

      const tasks: Task[] = response.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        status: item.status,
        priority: item.priority,
        category: item.category,
        createdAt: new Date(response.created_at),
        updatedAt: new Date(response.updated_at),
      }))

      set({
        tasks,
        currentChecklistId: response.id,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load checklist',
      })
      throw error
    }
  },

  /**
   * 加载用户的所有清单（取最新的一个）
   */
  loadUserChecklistsFromAPI: async (userId) => {
    set({ isLoading: true, error: null })
    try {
      const checklists = await checklistService.getUserChecklists(userId)

      if (checklists.length === 0) {
        set({ tasks: [], currentChecklistId: null, isLoading: false })
        return
      }

      // 使用最新的清单
      const latestChecklist = checklists[checklists.length - 1]
      const tasks: Task[] = latestChecklist.items.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        status: item.status,
        priority: item.priority,
        category: item.category,
        createdAt: new Date(latestChecklist.created_at),
        updatedAt: new Date(latestChecklist.updated_at),
      }))

      set({
        tasks,
        currentChecklistId: latestChecklist.id,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error:
          error instanceof Error ? error.message : 'Failed to load user checklists',
      })
      throw error
    }
  },

  /**
   * 更新任务状态并同步到后端
   */
  updateTaskStatusInAPI: async (itemId, newStatus, userId) => {
    const { currentChecklistId } = get()
    if (!currentChecklistId) {
      throw new Error('No checklist loaded')
    }

    // 先更新本地状态（乐观更新）
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === itemId
          ? { ...task, status: newStatus, updatedAt: new Date() }
          : task
      ),
    }))

    try {
      // 同步到后端
      await checklistService.updateItemStatus(currentChecklistId, userId, {
        item_id: itemId,
        status: newStatus,
      })
    } catch (error) {
      // 如果失败，回滚本地状态
      set((state) => ({
        error:
          error instanceof Error ? error.message : 'Failed to update task status',
      }))
      // 重新加载以恢复正确状态
      await get().loadChecklistFromAPI(currentChecklistId, userId)
      throw error
    }
  },

  /**
   * 删除当前清单
   */
  deleteChecklistFromAPI: async (userId) => {
    const { currentChecklistId } = get()
    if (!currentChecklistId) {
      throw new Error('No checklist loaded')
    }

    set({ isLoading: true, error: null })
    try {
      await checklistService.deleteChecklist(currentChecklistId, userId)
      set({
        tasks: [],
        currentChecklistId: null,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to delete checklist',
      })
      throw error
    }
  },
}))
