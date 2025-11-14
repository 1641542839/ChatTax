'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserChecklists, deleteChecklist } from '@/services/checklistService'
import type { ChecklistResponse } from '@/services/checklistService'
import { useAuthStore } from '@/store/authStore'
import {
  Card,
  Typography,
  Space,
  Button,
  Spin,
  Empty,
  Tag,
  Progress,
  Row,
  Col,
  Statistic,
  Tooltip,
  message,
  Modal,
  Popconfirm,
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  RocketOutlined,
  EyeOutlined,
  CalendarOutlined,
  FileTextOutlined,
  BarChartOutlined,
  PlusOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

/**
 * My Checklists Page
 * 
 * Displays all checklists for the logged-in user
 * Shows completion stats, creation date, and quick actions
 */
export default function ChecklistsPage() {
  const router = useRouter()
  const { token, isAuthenticated } = useAuthStore()
  const [checklists, setChecklists] = useState<ChecklistResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  /**
   * Load all user checklists on mount
   */
  useEffect(() => {
    const loadChecklists = async () => {
      // Check authentication - also check localStorage for token
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      const finalToken = token || storedToken
      
      if (!finalToken) {
        console.log('No token found, redirecting to login', { 
          authStoreToken: !!token, 
          localStorageToken: !!storedToken 
        })
        router.push('/login')
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        console.log('Fetching checklists with token:', finalToken?.substring(0, 20) + '...')
        console.log('Token length:', finalToken?.length)
        console.log('Authorization header will be:', `Bearer ${finalToken?.substring(0, 30)}...`)
        
        const data = await getUserChecklists(finalToken)
        console.log('Checklists loaded:', data.length)
        setChecklists(data)
      } catch (err) {
        console.error('Failed to load checklists:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to load checklists'
        setError(errorMessage)
        message.error(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    loadChecklists()
  }, [isAuthenticated, token, router])

  /**
   * Calculate overall statistics
   */
  const totalChecklists = checklists.length
  const totalTasks = checklists.reduce((sum, cl) => sum + cl.items.length, 0)
  const completedTasks = checklists.reduce(
    (sum, cl) => sum + cl.items.filter(item => item.status === 'done').length,
    0
  )
  const overallCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  /**
   * Calculate completion for a single checklist
   */
  const getChecklistCompletion = (checklist: ChecklistResponse) => {
    const total = checklist.items.length
    const completed = checklist.items.filter(item => item.status === 'done').length
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  /**
   * Navigation handlers
   */
  const handleViewChecklist = (checklistId: number) => {
    router.push(`/checklist?id=${checklistId}`)
  }

  const handleCreateNew = () => {
    router.push('/checklist/generate')
  }

  const handleStartChat = () => {
    router.push('/chat')
  }

  /**
   * Delete checklist handler
   */
  const handleDeleteChecklist = async (checklistId: number) => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    const finalToken = token || storedToken
    
    if (!finalToken) {
      message.error('Authentication required')
      return
    }

    try {
      setDeletingId(checklistId)
      await deleteChecklist(checklistId, finalToken)
      
      // Remove from local state
      setChecklists(prev => prev.filter(cl => cl.id !== checklistId))
      message.success('Checklist deleted successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete checklist'
      message.error(errorMessage)
    } finally {
      setDeletingId(null)
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Space direction="vertical" align="center" size="large">
          <Spin size="large" />
          <Text style={{ color: 'white', fontSize: '16px' }}>
            Loading your checklists...
          </Text>
        </Space>
      </div>
    )
  }

  // ==================== Render: Main View ====================
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '3rem 0',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <div style={{ 
            display: 'inline-block', 
            padding: '1rem 2rem', 
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '50px',
            marginBottom: '1rem',
            backdropFilter: 'blur(10px)',
          }}>
            <FileTextOutlined style={{ fontSize: '48px', color: 'white' }} />
          </div>
          <Title level={1} style={{ color: 'white', marginBottom: '0.5rem', fontSize: '42px', fontWeight: 'bold' }}>
            My Tax Checklists
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.95)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
            Manage all your tax preparation checklists in one place. Track progress, view details, and stay organized.
          </Paragraph>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: '3rem' }}>
          <Col xs={24} sm={8}>
            <Card
              style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: 'none',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
              }}
              bodyStyle={{ padding: '32px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'
              }}
            >
              <Statistic
                title={<span style={{ fontSize: '16px', color: '#64748b' }}>Total Checklists</span>}
                value={totalChecklists}
                prefix={<FileTextOutlined style={{ color: '#3b82f6', fontSize: '24px' }} />}
                valueStyle={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '42px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: 'none',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
              }}
              bodyStyle={{ padding: '32px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'
              }}
            >
              <Statistic
                title={<span style={{ fontSize: '16px', color: '#64748b' }}>Total Tasks</span>}
                value={totalTasks}
                prefix={<BarChartOutlined style={{ color: '#10b981', fontSize: '24px' }} />}
                valueStyle={{ color: '#10b981', fontWeight: 'bold', fontSize: '42px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                border: 'none',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
              }}
              bodyStyle={{ padding: '32px' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 12px 48px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)'
              }}
            >
              <Statistic
                title={<span style={{ fontSize: '16px', color: '#64748b' }}>Overall Completion</span>}
                value={overallCompletion}
                suffix="%"
                prefix={<CheckCircleOutlined style={{ color: '#8b5cf6', fontSize: '24px' }} />}
                valueStyle={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '42px' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Action Buttons */}
        <div style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <Space size="large">
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              onClick={handleCreateNew}
              style={{
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                border: 'none',
                height: '56px',
                padding: '0 40px',
                fontSize: '18px',
                fontWeight: 'bold',
                borderRadius: '28px',
                boxShadow: '0 8px 24px rgba(250, 112, 154, 0.4)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(250, 112, 154, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(250, 112, 154, 0.4)'
              }}
            >
              Generate New Checklist
            </Button>
            <Button
              size="large"
              icon={<RocketOutlined />}
              onClick={handleStartChat}
              style={{
                background: 'rgba(255,255,255,0.95)',
                height: '56px',
                padding: '0 40px',
                fontSize: '18px',
                fontWeight: '600',
                borderRadius: '28px',
                border: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'
              }}
            >
              Start Chat Session
            </Button>
          </Space>
        </div>

        {/* Error Alert */}
        {error && (
          <Card
            style={{
              background: '#fff2e8',
              border: '1px solid #ffbb96',
              marginBottom: '1rem',
            }}
          >
            <Text type="danger">{error}</Text>
          </Card>
        )}

        {/* Checklists Grid */}
        {checklists.length === 0 ? (
          <Card
            style={{
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '12px',
              padding: '3rem',
              textAlign: 'center',
            }}
          >
            <Empty
              description={
                <Space direction="vertical" size="middle">
                  <Text style={{ fontSize: '16px', color: '#8c8c8c' }}>
                    No checklists yet. Start by creating your first one!
                  </Text>
                </Space>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Space size="middle">
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={handleCreateNew}
                >
                  Generate Checklist
                </Button>
                <Button size="large" icon={<RocketOutlined />} onClick={handleStartChat}>
                  Start Chat
                </Button>
              </Space>
            </Empty>
          </Card>
        ) : (
          <Row gutter={[24, 24]}>
            {checklists.map((checklist) => {
              const completion = getChecklistCompletion(checklist)
              const completedCount = checklist.items.filter(item => item.status === 'done').length
              const totalCount = checklist.items.length

              return (
                <Col key={checklist.id} xs={24} sm={12} lg={8}>
                  <Card
                    hoverable
                    style={{
                      background: 'rgba(255,255,255,0.95)',
                      borderRadius: '12px',
                      height: '100%',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s ease',
                    }}
                    bodyStyle={{ padding: '24px' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)'
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                  >
                    {/* Checklist Header */}
                    <div style={{ marginBottom: '16px' }}>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Tag color="blue" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                          #{checklist.id}
                        </Tag>
                        <Tag
                          icon={<CalendarOutlined />}
                          color="default"
                          style={{ fontSize: '11px' }}
                        >
                          {new Date(checklist.created_at).toLocaleDateString()}
                        </Tag>
                      </Space>
                    </div>

                    {/* Identity Info */}
                    <div style={{ marginBottom: '16px' }}>
                      <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '8px' }}>
                        Tax Checklist
                      </Text>
                      <Space size={[8, 8]} wrap>
                        <Tag color="green" icon={<CheckCircleOutlined />}>
                          {checklist.identity_info.employment_status.replace('_', ' ')}
                        </Tag>
                        {checklist.identity_info.has_dependents && (
                          <Tag color="orange">Dependents</Tag>
                        )}
                        {checklist.identity_info.has_investment && (
                          <Tag color="purple">Investments</Tag>
                        )}
                        {checklist.identity_info.has_rental_property && (
                          <Tag color="cyan">Rental</Tag>
                        )}
                      </Space>
                    </div>

                    {/* Progress */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <Text type="secondary" style={{ fontSize: '13px' }}>
                          Progress
                        </Text>
                        <Text strong style={{ fontSize: '13px' }}>
                          {completedCount} / {totalCount}
                        </Text>
                      </div>
                      <Progress
                        percent={completion}
                        status={completion === 100 ? 'success' : 'active'}
                        strokeColor={{
                          '0%': '#667eea',
                          '100%': '#764ba2',
                        }}
                        size="small"
                      />
                    </div>

                    {/* Actions */}
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <Button
                        type="primary"
                        block
                        icon={<EyeOutlined />}
                        onClick={() => handleViewChecklist(checklist.id)}
                        style={{
                          height: '40px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                        }}
                      >
                        View Checklist
                      </Button>
                      <Popconfirm
                        title="Delete Checklist"
                        description="Are you sure you want to delete this checklist? This action cannot be undone."
                        onConfirm={() => handleDeleteChecklist(checklist.id)}
                        okText="Yes, Delete"
                        cancelText="Cancel"
                        okButtonProps={{ danger: true }}
                        icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                      >
                        <Button
                          danger
                          block
                          icon={<DeleteOutlined />}
                          loading={deletingId === checklist.id}
                          style={{
                            height: '36px',
                            borderRadius: '8px',
                          }}
                        >
                          Delete
                        </Button>
                      </Popconfirm>
                    </Space>
                  </Card>
                </Col>
              )
            })}
          </Row>
        )}
      </div>
    </div>
  )
}
