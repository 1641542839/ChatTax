'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChecklistStore } from '@/store/checklistStore'
import TaskCard from '@/components/checklist/TaskCard'
import ChecklistToolbar from '@/components/checklist/ChecklistToolbar'
import {
  Card,
  Typography,
  Progress,
  Empty,
  Space,
  Button,
  Spin,
  Alert,
  message,
} from 'antd'
import {
  CheckCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  RocketOutlined,
  MessageOutlined,
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

export default function ChecklistPage() {
  const router = useRouter()
  const {
    getFilteredTasks,
    tasks,
    initializeDefaultTasks,
    loadUserChecklistsFromAPI,
    isLoading,
    error,
    currentChecklistId,
  } = useChecklistStore()

  const [dataSource, setDataSource] = useState<'local' | 'api'>('local')

  // 初始化：尝试从 API 加载，失败则使用本地数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 尝试从 API 加载用户清单（使用测试用户 ID = 1）
        await loadUserChecklistsFromAPI(1)
        setDataSource('api')
      } catch (err) {
        // API 失败，使用本地默认数据
        console.log('Failed to load from API, using local data')
        initializeDefaultTasks()
        setDataSource('local')
      }
    }

    initializeData()
  }, [])

  const filteredTasks = getFilteredTasks()
  const completedCount = tasks.filter((task) => task.status === 'done').length
  const totalCount = tasks.length
  const progress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // Reload data
  const handleReload = async () => {
    try {
      await loadUserChecklistsFromAPI(1)
      setDataSource('api')
      message.success('✅ Checklist refreshed')
    } catch (err) {
      message.error('Failed to refresh')
    }
  }

  // Navigate to generate page
  const handleGenerate = () => {
    router.push('/checklist/generate')
  }

  // Navigate to Chat to ask AI
  const handleAskAI = () => {
    router.push('/chat')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Card className="mb-6 shadow-lg">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Title level={2} className="mb-0">
                  ✅ Tax Preparation Checklist
                </Title>
                {dataSource === 'api' && currentChecklistId && (
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                    🔗 API #{currentChecklistId}
                  </span>
                )}
                {dataSource === 'local' && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                    📁 Local Data
                  </span>
                )}
              </div>
              <Paragraph className="text-gray-600">
                Track your tax preparation progress and ensure you have all necessary
                documents and information
              </Paragraph>
            </div>

            {/* Action Buttons */}
            <Space>
              <Button
                icon={<MessageOutlined />}
                onClick={handleAskAI}
              >
                Ask AI
              </Button>
              <Button
                icon={<RocketOutlined />}
                type="primary"
                onClick={handleGenerate}
              >
                Generate New Checklist
              </Button>
              {dataSource === 'api' && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleReload}
                  loading={isLoading}
                >
                  Refresh
                </Button>
              )}
            </Space>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              closable
              className="mb-4"
            />
          )}

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

        {/* Loading State */}
        {isLoading && (
          <Card className="shadow-lg">
            <div className="py-12 text-center">
              <Spin size="large" tip="Loading..." />
            </div>
          </Card>
        )}

        {/* Task List */}
        {!isLoading &&
          (filteredTasks.length === 0 ? (
            <Card className="shadow-lg">
              <Empty
                description={
                  <div className="text-center">
                    <Text className="text-lg text-gray-600">
                      {tasks.length === 0
                        ? 'No checklist yet, click "Generate New Checklist" above to start!'
                        : 'No tasks found with the current filter'}
                    </Text>
                  </div>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                {tasks.length === 0 && (
                  <Button
                    type="primary"
                    icon={<RocketOutlined />}
                    onClick={handleGenerate}
                  >
                    Generate Personalized Checklist
                  </Button>
                )}
              </Empty>
            </Card>
          ) : (
            <Space direction="vertical" size="middle" className="w-full">
              {filteredTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </Space>
          ))}

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
