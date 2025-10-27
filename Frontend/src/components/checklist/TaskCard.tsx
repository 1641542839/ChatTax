'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Task, TaskStatus, useChecklistStore } from '@/store/checklistStore'
import { Card, Checkbox, Tag, Button, Popconfirm, message, Space } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EditOutlined,
  MessageOutlined,
} from '@ant-design/icons'

interface TaskCardProps {
  task: Task
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'todo':
      return 'default'
    case 'doing':
      return 'processing'
    case 'done':
      return 'success'
  }
}

const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'todo':
      return <ClockCircleOutlined />
    case 'doing':
      return <ClockCircleOutlined spin />
    case 'done':
      return <CheckCircleOutlined />
  }
}

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'high':
      return 'red'
    case 'medium':
      return 'orange'
    case 'low':
      return 'blue'
    default:
      return 'default'
  }
}

export default function TaskCard({ task }: TaskCardProps) {
  const router = useRouter()
  const {
    toggleTaskStatus,
    deleteTask,
    updateTaskStatusInAPI,
    currentChecklistId,
  } = useChecklistStore()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleToggle = async () => {
    // 如果有 API 连接，同步到后端
    if (currentChecklistId) {
      setIsUpdating(true)
      try {
        // 计算下一个状态
        let newStatus: TaskStatus
        if (task.status === 'todo') newStatus = 'doing'
        else if (task.status === 'doing') newStatus = 'done'
        else newStatus = 'todo'

        await updateTaskStatusInAPI(task.id, newStatus, 1) // 使用测试用户 ID
        message.success(`✅ 状态已更新为 ${newStatus}`)
      } catch (err) {
        message.error('更新失败，请重试')
      } finally {
        setIsUpdating(false)
      }
    } else {
      // 本地模式，直接切换
      toggleTaskStatus(task.id)
    }
  }

  const handleDelete = () => {
    deleteTask(task.id)
    message.success('Task deleted')
  }

  // Ask AI about this task
  const handleAskAI = () => {
    const question = `Regarding the task "${task.title}", I would like to know:\n1. What specific materials do I need to prepare?\n2. What precautions should I take?\n3. Approximately how long will it take to complete?`
    
    // Save question to localStorage
    localStorage.setItem('pendingQuestion', question)
    
    // Navigate to chat page
    router.push('/chat')
    
    message.info('Navigating to AI Assistant...')
  }

  return (
    <Card
      className={`task-card transition-all hover:shadow-lg ${
        task.status === 'done' ? 'bg-green-50' : 'bg-white'
      }`}
      bordered
    >
      <div className="flex items-start gap-4">
        {/* Checkbox */}
        <Checkbox
          checked={task.status === 'done'}
          onChange={handleToggle}
          disabled={isUpdating}
          className="mt-1"
        />

        {/* Content */}
        <div className="flex-1">
          {/* Title and Tags */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3
              className={`text-lg font-semibold ${
                task.status === 'done'
                  ? 'text-gray-400 line-through'
                  : 'text-gray-900'
              }`}
            >
              {task.title}
            </h3>
            <Tag
              color={getStatusColor(task.status)}
              icon={getStatusIcon(task.status)}
            >
              {task.status.toUpperCase()}
            </Tag>
            {task.priority && (
              <Tag color={getPriorityColor(task.priority)}>
                {task.priority.toUpperCase()}
              </Tag>
            )}
          </div>

          {/* Description */}
          <p
            className={`mb-3 text-sm ${
              task.status === 'done' ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            {task.description}
          </p>

          {/* Category and Date */}
          <div className="flex flex-wrap items-center gap-2">
            {task.category && (
              <Tag icon={<FileTextOutlined />} color="blue">
                {task.category}
              </Tag>
            )}
            <span className="text-xs text-gray-400">
              Updated: {new Date(task.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <Button
            type="text"
            size="small"
            icon={<MessageOutlined />}
            onClick={handleAskAI}
            title="Ask AI"
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={handleToggle}
            loading={isUpdating}
            disabled={isUpdating}
            title="Change status"
          />
          {!currentChecklistId && (
            <Popconfirm
              title="Delete task?"
              description="This action cannot be undone."
              onConfirm={handleDelete}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                title="Delete task"
              />
            </Popconfirm>
          )}
        </div>
      </div>
    </Card>
  )
}
