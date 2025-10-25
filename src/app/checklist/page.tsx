'use client'

import { useState } from 'react'
import {
  Card,
  Typography,
  Checkbox,
  Button,
  Progress,
  Space,
  Tag,
  Divider,
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography

interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  category: string
  priority: 'high' | 'medium' | 'low'
}

const initialChecklist: ChecklistItem[] = [
  {
    id: '1',
    title: 'Gather W-2 Forms',
    description: 'Collect all W-2 forms from your employers for the tax year',
    completed: false,
    category: 'Documents',
    priority: 'high',
  },
  {
    id: '2',
    title: 'Collect 1099 Forms',
    description: 'Gather all 1099 forms (1099-INT, 1099-DIV, 1099-MISC, etc.)',
    completed: false,
    category: 'Documents',
    priority: 'high',
  },
  {
    id: '3',
    title: 'Review Deductible Expenses',
    description:
      'Compile receipts for deductible expenses (medical, charitable, business)',
    completed: false,
    category: 'Deductions',
    priority: 'medium',
  },
  {
    id: '4',
    title: 'Mortgage Interest Statement',
    description: 'Obtain Form 1098 for mortgage interest paid',
    completed: false,
    category: 'Documents',
    priority: 'medium',
  },
  {
    id: '5',
    title: 'Student Loan Interest',
    description: 'Get Form 1098-E for student loan interest paid',
    completed: false,
    category: 'Documents',
    priority: 'low',
  },
  {
    id: '6',
    title: 'Healthcare Coverage',
    description: 'Verify Form 1095-A, B, or C for healthcare coverage',
    completed: false,
    category: 'Healthcare',
    priority: 'medium',
  },
  {
    id: '7',
    title: 'IRA Contributions',
    description: 'Document all IRA and retirement account contributions',
    completed: false,
    category: 'Retirement',
    priority: 'medium',
  },
  {
    id: '8',
    title: 'Review Tax Credits',
    description:
      'Check eligibility for tax credits (child care, education, energy)',
    completed: false,
    category: 'Credits',
    priority: 'high',
  },
]

export default function ChecklistPage() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist)

  const handleToggle = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
  }

  const completedCount = checklist.filter((item) => item.completed).length
  const progress = Math.round((completedCount / checklist.length) * 100)

  const getPriorityColor = (priority: string) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Card className="shadow-xl">
          <div className="mb-6">
            <Title level={2} className="mb-2">
              ✅ Tax Preparation Checklist
            </Title>
            <Paragraph className="text-gray-600">
              Track your tax preparation progress and ensure you have all
              necessary documents
            </Paragraph>
          </div>

          <Divider />

          {/* Progress Section */}
          <div className="mb-8 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
            <div className="mb-4 flex items-center justify-between">
              <Text strong className="text-lg">
                Overall Progress
              </Text>
              <Text className="text-2xl font-bold text-primary-600">
                {completedCount} / {checklist.length}
              </Text>
            </div>
            <Progress
              percent={progress}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              status={progress === 100 ? 'success' : 'active'}
            />
          </div>

          {/* Checklist Items */}
          <Space direction="vertical" size="middle" className="w-full">
            {checklist.map((item) => (
              <Card
                key={item.id}
                size="small"
                className={`transition-all hover:shadow-md ${
                  item.completed ? 'bg-green-50' : 'bg-white'
                }`}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={item.completed}
                    onChange={() => handleToggle(item.id)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Text
                        strong
                        delete={item.completed}
                        className={`text-base ${
                          item.completed ? 'text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        {item.title}
                      </Text>
                      <Tag color={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Tag>
                      {item.completed && (
                        <CheckCircleOutlined className="text-green-500" />
                      )}
                      {!item.completed && (
                        <ClockCircleOutlined className="text-orange-500" />
                      )}
                    </div>
                    <Paragraph
                      className={`mb-2 ${
                        item.completed ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      {item.description}
                    </Paragraph>
                    <Tag icon={<FileTextOutlined />} color="blue">
                      {item.category}
                    </Tag>
                  </div>
                </div>
              </Card>
            ))}
          </Space>

          <Divider />

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              type="default"
              onClick={() => setChecklist(initialChecklist)}
            >
              Reset All
            </Button>
            <Button
              type="primary"
              disabled={progress !== 100}
              onClick={() => alert('Ready to file! 🎉')}
            >
              {progress === 100 ? 'Ready to File!' : 'Complete All Items'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
