'use client'

import { useEffect } from 'react'
import { useChecklistStore } from '@/store/checklistStore'
import TaskCard from '@/components/checklist/TaskCard'
import ChecklistToolbar from '@/components/checklist/ChecklistToolbar'
import { Card, Typography, Progress, Empty, Space } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

export default function ChecklistPage() {
  const { getFilteredTasks, tasks, initializeDefaultTasks } =
    useChecklistStore()

  // Initialize default tasks on mount
  useEffect(() => {
    initializeDefaultTasks()
  }, [initializeDefaultTasks])

  const filteredTasks = getFilteredTasks()
  const completedCount = tasks.filter((task) => task.status === 'done').length
  const totalCount = tasks.length
  const progress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Card className="mb-6 shadow-lg">
          <div className="mb-4">
            <Title level={2} className="mb-2">
              ✅ Tax Preparation Checklist
            </Title>
            <Paragraph className="text-gray-600">
              Track your tax preparation progress and ensure you have all
              necessary documents and information
            </Paragraph>
          </div>

          {/* Progress Section */}
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircleOutlined className="text-2xl text-primary-600" />
                <Text strong className="text-lg">
                  Overall Progress
                </Text>
              </div>
              <Text className="text-2xl font-bold text-primary-600">
                {completedCount} / {totalCount}
              </Text>
            </div>
            <Progress
              percent={progress}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              status={progress === 100 ? 'success' : 'active'}
              strokeWidth={12}
            />
            <div className="mt-3 flex justify-between text-sm text-gray-600">
              <span>{progress}% Complete</span>
              <span>{totalCount - completedCount} tasks remaining</span>
            </div>
          </div>
        </Card>

        {/* Toolbar */}
        <ChecklistToolbar />

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <Card className="shadow-lg">
            <Empty
              description={
                <div className="text-center">
                  <Text className="text-lg text-gray-600">
                    No tasks found with the current filter
                  </Text>
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        ) : (
          <Space direction="vertical" size="middle" className="w-full">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </Space>
        )}

        {/* Footer Info */}
        <Card className="mt-6 bg-blue-50 shadow-lg">
          <div className="text-center">
            <Text className="text-sm text-gray-600">
              💡 <strong>Tip:</strong> Use the filters above to focus on
              specific task statuses. Export to PDF or share your progress with
              your tax advisor.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  )
}
