import { create } from 'zustand'
import { nanoid } from 'nanoid'

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

  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTaskStatus: (id: string) => void
  setFilter: (filter: TaskStatus | 'all') => void
  getFilteredTasks: () => Task[]
  initializeDefaultTasks: () => void
}

const defaultTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Gather W-2 Forms',
    description:
      'Collect all W-2 forms from your employers for the tax year. Ensure you have received forms from all employers you worked for during the year.',
    status: 'done',
    priority: 'high',
    category: 'Documents',
  },
  {
    title: 'Collect 1099 Forms',
    description:
      'Gather all 1099 forms including 1099-INT (interest income), 1099-DIV (dividends), 1099-MISC (miscellaneous income), and any other 1099 variants.',
    status: 'doing',
    priority: 'high',
    category: 'Documents',
  },
  {
    title: 'Review Deductible Expenses',
    description:
      'Compile receipts and documentation for all deductible expenses such as medical expenses, charitable donations, business expenses, and educational costs.',
    status: 'todo',
    priority: 'medium',
    category: 'Deductions',
  },
  {
    title: 'Mortgage Interest Statement',
    description:
      'Obtain Form 1098 from your mortgage lender showing the amount of mortgage interest you paid during the tax year.',
    status: 'todo',
    priority: 'medium',
    category: 'Documents',
  },
  {
    title: 'Student Loan Interest',
    description:
      'Get Form 1098-E from your student loan servicer documenting the interest paid on qualified student loans.',
    status: 'todo',
    priority: 'low',
    category: 'Documents',
  },
  {
    title: 'Healthcare Coverage Verification',
    description:
      'Verify you have Form 1095-A (Marketplace), 1095-B (Employer), or 1095-C (Large Employer) for healthcare coverage documentation.',
    status: 'todo',
    priority: 'medium',
    category: 'Healthcare',
  },
  {
    title: 'IRA and Retirement Contributions',
    description:
      'Document all contributions made to IRA, 401(k), and other retirement accounts. Include employer matching contributions.',
    status: 'doing',
    priority: 'medium',
    category: 'Retirement',
  },
  {
    title: 'Review Tax Credits Eligibility',
    description:
      'Check eligibility for tax credits including Child Tax Credit, Earned Income Credit, Education Credits, and Energy Efficiency Credits.',
    status: 'todo',
    priority: 'high',
    category: 'Credits',
  },
]

export const useChecklistStore = create<ChecklistState>((set, get) => ({
  tasks: [],
  filter: 'all',

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
}))
