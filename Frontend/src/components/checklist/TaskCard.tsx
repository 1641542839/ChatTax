'use client'

import { Task, TaskStatus, useChecklistStore } from '@/store/checklistStore'
import { Card, Checkbox, Tag, Button, Popconfirm } from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  DeleteOutlined,
  EditOutlined,
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
  const { toggleTaskStatus, deleteTask } = useChecklistStore()

  const handleToggle = () => {
    toggleTaskStatus(task.id)
  }

  const handleDelete = () => {
    deleteTask(task.id)
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
            icon={<EditOutlined />}
            onClick={handleToggle}
            title="Change status"
          />
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
        </div>
      </div>
    </Card>
  )
}
