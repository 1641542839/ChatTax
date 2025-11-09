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

  // Extract user information from conversation history
  const extractIdentityFromChat = () => {
    const allText = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join(' ')
      .toLowerCase()

    let employmentStatus: 'employed' | 'self_employed' | 'unemployed' | 'retired' = 'employed'

    // Detect employment status
    if (allText.includes('self-employed') || allText.includes('contractor') || allText.includes('sole trader') || allText.includes('freelance')) {
      employmentStatus = 'self_employed'
    } else if (allText.includes('retired') || allText.includes('retirement') || allText.includes('pension')) {
      employmentStatus = 'retired'
    } else if (allText.includes('unemployed') || allText.includes('jobless') || allText.includes('between jobs')) {
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

    // Detect income sources
    if (
      allText.includes('salary') ||
      allText.includes('wage') ||
      allText.includes('payg') ||
      allText.includes('employee')
    ) {
      identityInfo.income_sources.push('salary')
    }
    if (
      allText.includes('investment') ||
      allText.includes('shares') ||
      allText.includes('stocks') ||
      allText.includes('dividend') ||
      allText.includes('capital gain')
    ) {
      identityInfo.income_sources.push('investment')
      identityInfo.has_investment = true
    }
    if (allText.includes('rental') || allText.includes('property') || allText.includes('landlord') || allText.includes('rent income')) {
      identityInfo.income_sources.push('rental')
      identityInfo.has_rental_property = true
    }

    // If no income source detected, default to salary
    if (identityInfo.income_sources.length === 0) {
      identityInfo.income_sources.push('salary')
    }

    // Detect other information
    identityInfo.has_dependents =
      allText.includes('child') ||
      allText.includes('children') ||
      allText.includes('kids') ||
      allText.includes('dependent')

    identityInfo.is_first_time_filer =
      allText.includes('first time') ||
      allText.includes('never filed') ||
      allText.includes('never lodged')

    // Detect industry
    if (allText.includes('programmer') || allText.includes('developer') || allText.includes('IT') || allText.includes('tech')) {
      identityInfo.additional_info.industry = 'technology'
    } else if (allText.includes('doctor') || allText.includes('nurse') || allText.includes('medical') || allText.includes('healthcare')) {
      identityInfo.additional_info.industry = 'healthcare'
    } else if (allText.includes('teacher') || allText.includes('education') || allText.includes('tutor')) {
      identityInfo.additional_info.industry = 'education'
    }

    // Detect home office
    identityInfo.additional_info.has_home_office =
      allText.includes('work from home') ||
      allText.includes('home office') ||
      allText.includes('remote work') ||
      allText.includes('wfh')

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
