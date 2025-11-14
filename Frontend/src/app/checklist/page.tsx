'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getChecklist } from '@/services/checklistService'
import type { ChecklistResponse } from '@/services/checklistService'
import { useChecklistStore } from '@/store/checklistStore'
import { useAuthStore } from '@/store/authStore'
import { isTokenExpired, clearAuthTokens } from '@/lib/tokenUtils'
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
  Breadcrumb,
  Tag,
} from 'antd'
import {
  CheckCircleOutlined,
  ReloadOutlined,
  MessageOutlined,
  HomeOutlined,
  CalendarOutlined,
  RocketOutlined,
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

/**
 * Checklist Page Component
 * 
 * Support two modes:
 * 1. Session mode: Load specific checklist by ID from URL (/checklist?id=123)
 * 2. Store mode: Load checklist from Zustand store (generated from form)
 * 
 * Design Reference: CHECKLIST_GENERATION_DESIGN.md
 */
export default function ChecklistPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const checklistId = searchParams.get('id')
  const { token, logout } = useAuthStore()
  
  // Session mode state
  const [checklist, setChecklist] = useState<ChecklistResponse | null>(null)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [errorSession, setErrorSession] = useState<string | null>(null)

  // Store mode state
  const {
    tasks,
    getFilteredTasks,
    initializeDefaultTasks,
    loadUserChecklistsFromAPI,
    isLoading: isLoadingStore,
    error: errorStore,
    currentChecklistId,
  } = useChecklistStore()

  const [dataSource, setDataSource] = useState<'session' | 'store' | null>(null)

  /**
   * Load checklist: Priority to URL parameter, fallback to store
   */
  useEffect(() => {
    const loadData = async () => {
      // Mode 1: Load from URL parameter (session-generated checklist)
      if (checklistId) {
        // Check authentication
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        const finalToken = token || storedToken
        
        if (!finalToken) {
          message.warning('请先登录')
          router.push('/login')
          return
        }
        
        // Check if token is expired
        if (isTokenExpired(finalToken)) {
          message.warning('登录已过期，请重新登录')
          clearAuthTokens()
          logout()
          router.push('/login')
          return
        }
        
        setDataSource('session')
        setIsLoadingSession(true)
        try {
          const data = await getChecklist(Number(checklistId), finalToken)
          setChecklist(data)
          setErrorSession(null)
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load checklist'
          setErrorSession(errorMessage)
          message.error(errorMessage)
        } finally {
          setIsLoadingSession(false)
        }
      } else {
        // Mode 2: Load from store (form-generated checklist)
        // Check authentication
        const storedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
        const finalToken = token || storedToken
        
        if (!finalToken) {
          message.warning('请先登录')
          router.push('/login')
          return
        }
        
        if (isTokenExpired(finalToken)) {
          message.warning('登录已过期，请重新登录')
          clearAuthTokens()
          logout()
          router.push('/login')
          return
        }
        
        setDataSource('store')
        try {
          await loadUserChecklistsFromAPI(finalToken)
        } catch (err) {
          console.log('Failed to load from API, using default data')
          initializeDefaultTasks()
        }
      }
    }

    loadData()
  }, [checklistId])

  /**
   * Calculate statistics based on current mode
   */
  const isLoading = dataSource === 'session' ? isLoadingSession : isLoadingStore
  const error = dataSource === 'session' ? errorSession : errorStore
  
  let items: any[] = []
  let completedCount = 0
  let totalCount = 0
  let completionPercentage = 0

  if (dataSource === 'session' && checklist) {
    items = checklist.items || []
    completedCount = items.filter((item) => item.status === 'done').length
    totalCount = items.length
    completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  } else if (dataSource === 'store') {
    const filteredTasks = getFilteredTasks()
    items = filteredTasks
    completedCount = tasks.filter((task) => task.status === 'done').length
    totalCount = tasks.length
    completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  }

  /**
   * Handlers
   */
  const handleBackToChat = () => {
    router.push('/chat')
  }

  const handleGenerateNew = () => {
    router.push('/checklist/generate')
  }

  const handleReload = async () => {
    if (dataSource === 'session' && checklistId) {
      // Get token
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      const finalToken = token || storedToken
      
      if (!finalToken) {
        message.warning('请先登录')
        router.push('/login')
        return
      }
      
      if (isTokenExpired(finalToken)) {
        message.warning('登录已过期，请重新登录')
        clearAuthTokens()
        logout()
        router.push('/login')
        return
      }
      
      setIsLoadingSession(true)
      try {
        const data = await getChecklist(Number(checklistId), finalToken)
        setChecklist(data)
        message.success('Checklist refreshed successfully')
      } catch (err) {
        message.error('Failed to refresh checklist')
      } finally {
        setIsLoadingSession(false)
      }
    } else if (dataSource === 'store') {
      // Get token for refresh
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      const finalToken = token || storedToken
      
      if (!finalToken) {
        message.warning('请先登录')
        router.push('/login')
        return
      }
      
      if (isTokenExpired(finalToken)) {
        message.warning('登录已过期，请重新登录')
        clearAuthTokens()
        logout()
        router.push('/login')
        return
      }
      
      try {
        await loadUserChecklistsFromAPI(finalToken)
        message.success('Checklist refreshed successfully')
      } catch (err) {
        message.error('Failed to refresh checklist')
      }
    }
  }

  // ==================== Render: Loading State ====================
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)',
        }}
      >
        <Space direction="vertical" align="center" size="large">
          <Spin size="large" />
          <Text type="secondary" style={{ fontSize: '16px' }}>
            Loading your tax checklist...
          </Text>
        </Space>
      </div>
    )
  }

  // ==================== Render: Error State ====================
  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          padding: '2rem',
          background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Alert
            message="Error Loading Checklist"
            description={error}
            type="error"
            showIcon
            action={
              <Space>
                {dataSource === 'session' && (
                  <Button size="small" onClick={handleBackToChat}>
                    Back to Chat
                  </Button>
                )}
                <Button size="small" danger onClick={handleReload}>
                  Try Again
                </Button>
              </Space>
            }
          />
        </div>
      </div>
    )
  }

  // ==================== Render: Main Checklist View ====================
  return (
    <div
      className="min-h-screen py-8"
      style={{
        background: 'linear-gradient(to bottom right, #EFF6FF, #E0E7FF)',
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          style={{ marginBottom: '1rem' }}
          items={[
            {
              title: (
                <Space>
                  <HomeOutlined />
                  <span>Home</span>
                </Space>
              ),
              onClick: () => router.push('/'),
              className: 'cursor-pointer',
            },
            ...(dataSource === 'session' ? [{
              title: 'Chat',
              onClick: handleBackToChat,
              className: 'cursor-pointer',
            }] : []),
            {
              title: dataSource === 'session' ? `Checklist #${checklistId}` : 'My Checklist',
            },
          ]}
        />

        {/* Header Card */}
        <Card className="mb-6 shadow-lg" bordered={false}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <CheckCircleOutlined style={{ fontSize: '32px', color: '#1890ff' }} />
                <Title level={2} className="mb-0">
                  Tax Preparation Checklist
                </Title>
                {dataSource === 'session' && checklistId && (
                  <Tag color="blue">#{checklistId}</Tag>
                )}
                {dataSource === 'store' && currentChecklistId && (
                  <Tag color="green">API #{currentChecklistId}</Tag>
                )}
                {dataSource === 'store' && !currentChecklistId && (
                  <Tag color="default">Local Data</Tag>
                )}
              </div>
              <Paragraph className="text-gray-600 mb-4">
                Track your tax preparation progress and ensure you have all necessary documents
              </Paragraph>

              {/* Identity Info Summary (Session mode only) */}
              {dataSource === 'session' && checklist && (
                <Space size="middle" wrap>
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    {checklist.identity_info.employment_status.replace('_', ' ').toUpperCase()}
                  </Tag>
                  <Tag color="blue">
                    {checklist.identity_info.income_sources.length} Income Source(s)
                  </Tag>
                  {checklist.identity_info.has_dependents && (
                    <Tag color="orange">Has Dependents</Tag>
                  )}
                  {checklist.identity_info.has_investment && (
                    <Tag color="purple">Has Investments</Tag>
                  )}
                  {checklist.identity_info.has_rental_property && (
                    <Tag color="cyan">Has Rental Property</Tag>
                  )}
                  <Tag icon={<CalendarOutlined />} color="default">
                    Created: {new Date(checklist.created_at).toLocaleDateString()}
                  </Tag>
                </Space>
              )}
            </div>

            {/* Action Buttons */}
            <Space>
              {dataSource === 'session' && (
                <Button icon={<MessageOutlined />} onClick={handleBackToChat}>
                  Back to Chat
                </Button>
              )}
              <Button icon={<RocketOutlined />} type="primary" onClick={handleGenerateNew}>
                Generate New
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReload}>
                Refresh
              </Button>
            </Space>
          </div>

          {/* Progress Bar */}
          <div style={{ marginTop: '1.5rem' }}>
            <div className="mb-2 flex items-center justify-between">
              <Text strong style={{ fontSize: '16px' }}>
                Overall Progress
              </Text>
              <Text type="secondary">
                {completedCount} / {totalCount} tasks completed
              </Text>
            </div>
            <Progress
              percent={completionPercentage}
              status={completionPercentage === 100 ? 'success' : 'active'}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              style={{ marginBottom: 0 }}
            />
          </div>
        </Card>

        {/* Toolbar (Store mode only) */}
        {dataSource === 'store' && <ChecklistToolbar />}

        {/* Tasks List */}
        <Card title="Tasks" bordered={false} className="shadow-lg">
          {items.length === 0 ? (
            <Empty
              description="No tasks found in this checklist"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button
                type="primary"
                icon={<RocketOutlined />}
                onClick={handleGenerateNew}
              >
                Generate Personalized Checklist
              </Button>
            </Empty>
          ) : (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {items.map((item) => {
                // Convert to Task format for TaskCard component
                const task = dataSource === 'session' && checklist
                  ? {
                      id: item.id,
                      title: item.title,
                      description: item.description,
                      category: item.category,
                      priority: item.priority,
                      status: item.status,
                      estimatedTime: item.estimated_time,
                      notes: '',
                      completed: item.status === 'done',
                      createdAt: new Date(checklist.created_at),
                      updatedAt: new Date(checklist.updated_at),
                    }
                  : item // Store mode already has correct format
                
                return <TaskCard key={item.id} task={task} />
              })}
            </Space>
          )}
        </Card>
      </div>
    </div>
  )
}
