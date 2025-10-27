'use client'

import { useRouter } from 'next/navigation'
import { useChecklistStore } from '@/store/checklistStore'
import { Card, Progress, Space, Button, Typography } from 'antd'
import { CheckCircleOutlined, RightOutlined } from '@ant-design/icons'

const { Text } = Typography

export default function ChecklistProgressWidget() {
  const router = useRouter()
  const { tasks, currentChecklistId } = useChecklistStore()

  // If no checklist, don't show
  if (!currentChecklistId || tasks.length === 0) {
    return null
  }

  const completedCount = tasks.filter((t) => t.status === 'done').length
  const totalCount = tasks.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <Card
      size="small"
      className="shadow-sm hover:shadow-md transition-shadow"
      style={{ borderRadius: 8 }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space>
          <CheckCircleOutlined className="text-green-500 text-lg" />
          <Text strong>My Checklist Progress</Text>
        </Space>

        <div className="flex items-center gap-3">
          <Progress
            type="circle"
            percent={progress}
            width={60}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <Space direction="vertical" size={0}>
            <Text>
              {completedCount} / {totalCount} Completed
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {totalCount - completedCount} task{totalCount - completedCount !== 1 ? 's' : ''} remaining
            </Text>
          </Space>
        </div>

        <Button
          type="link"
          icon={<RightOutlined />}
          onClick={() => router.push('/checklist')}
          style={{ padding: 0 }}
          block
        >
          View Full Checklist
        </Button>
      </Space>
    </Card>
  )
}
