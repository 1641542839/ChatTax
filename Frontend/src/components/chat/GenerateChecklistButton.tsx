'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Modal, message as antMessage, Space, Typography } from 'antd'
import { CheckCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { useChecklistStore } from '@/store/checklistStore'
import { createIdentityInfo } from '@/services/checklistService'
import type { Message } from '@/store/chatStore'

const { Text } = Typography

interface GenerateChecklistButtonProps {
  messages: Message[]
}

export default function GenerateChecklistButton({
  messages,
}: GenerateChecklistButtonProps) {
  const router = useRouter()
  const { generateChecklistFromAPI, isLoading } = useChecklistStore()
  const [showModal, setShowModal] = useState(false)

  // 从对话历史中提取用户信息
  const extractIdentityFromChat = () => {
    const allText = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join(' ')
      .toLowerCase()

    let employmentStatus: 'employed' | 'self_employed' | 'unemployed' | 'retired' = 'employed'

    // 检测就业状态
    if (allText.includes('自雇') || allText.includes('自由职业') || allText.includes('个体')) {
      employmentStatus = 'self_employed'
    } else if (allText.includes('退休')) {
      employmentStatus = 'retired'
    } else if (allText.includes('失业') || allText.includes('无业')) {
      employmentStatus = 'unemployed'
    }

    const identityInfo = {
      employment_status: employmentStatus,
      income_sources: [] as string[],
      has_dependents: false,
      has_investment: false,
      has_rental_property: false,
      is_first_time_filer: false,
      additional_info: {} as Record<string, any>,
    }

    // 检测收入来源
    if (
      allText.includes('工资') ||
      allText.includes('上班') ||
      allText.includes('员工')
    ) {
      identityInfo.income_sources.push('salary')
    }
    if (
      allText.includes('投资') ||
      allText.includes('股票') ||
      allText.includes('基金')
    ) {
      identityInfo.income_sources.push('investment')
      identityInfo.has_investment = true
    }
    if (allText.includes('租金') || allText.includes('出租') || allText.includes('房产')) {
      identityInfo.income_sources.push('rental')
      identityInfo.has_rental_property = true
    }

    // 如果没有检测到任何收入来源，默认添加工资
    if (identityInfo.income_sources.length === 0) {
      identityInfo.income_sources.push('salary')
    }

    // 检测其他信息
    identityInfo.has_dependents =
      allText.includes('孩子') ||
      allText.includes('小孩') ||
      allText.includes('子女') ||
      allText.includes('抚养')

    identityInfo.is_first_time_filer =
      allText.includes('第一次') ||
      allText.includes('首次') ||
      allText.includes('从未报税')

    // 检测行业
    if (allText.includes('程序员') || allText.includes('IT') || allText.includes('科技')) {
      identityInfo.additional_info.industry = 'technology'
    } else if (allText.includes('医生') || allText.includes('护士') || allText.includes('医疗')) {
      identityInfo.additional_info.industry = 'healthcare'
    } else if (allText.includes('老师') || allText.includes('教育')) {
      identityInfo.additional_info.industry = 'education'
    }

    // 检测家庭办公室
    identityInfo.additional_info.has_home_office =
      allText.includes('在家办公') ||
      allText.includes('家庭办公') ||
      allText.includes('远程工作')

    return createIdentityInfo(identityInfo.employment_status, {
      incomeSources: identityInfo.income_sources,
      hasDependents: identityInfo.has_dependents,
      hasInvestment: identityInfo.has_investment,
      hasRentalProperty: identityInfo.has_rental_property,
      isFirstTimeFiler: identityInfo.is_first_time_filer,
      additionalInfo: identityInfo.additional_info,
    })
  }

  const handleGenerateChecklist = async () => {
    try {
      const identityInfo = extractIdentityFromChat()

      // Call API to generate checklist
      await generateChecklistFromAPI(1, identityInfo) // Using fixed user ID

      antMessage.success('🎉 Personalized checklist generated!')

      // Show navigation confirmation
      setShowModal(true)
    } catch (error) {
      console.error('Generate checklist error:', error)
      antMessage.error('Failed to generate checklist, please try again')
    }
  }

  const handleNavigate = () => {
    setShowModal(false)
    router.push('/checklist')
  }

  return (
    <>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={handleGenerateChecklist}
        loading={isLoading}
        size="large"
        style={{
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(24, 144, 255, 0.2)',
        }}
      >
        📋 Generate Task Checklist for Me
      </Button>

      <Modal
        open={showModal}
        onCancel={() => setShowModal(false)}
        onOk={handleNavigate}
        okText="View Now"
        cancelText="View Later"
        centered
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <CheckCircleOutlined
              style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }}
            />
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
              Checklist Generated Successfully!
            </h3>
          </div>
          <Text type="secondary" style={{ textAlign: 'center', display: 'block' }}>
            AI has generated a personalized tax preparation checklist based on your conversation
          </Text>
        </Space>
      </Modal>
    </>
  )
}
