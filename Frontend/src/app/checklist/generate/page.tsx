'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useChecklistStore } from '@/store/checklistStore'
import { createIdentityInfo } from '@/services/checklistService'
import {
  Card,
  Form,
  Select,
  Checkbox,
  Button,
  Typography,
  Space,
  message,
  Spin,
  Alert,
} from 'antd'
import {
  RocketOutlined,
  UserOutlined,
  DollarOutlined,
  HomeOutlined,
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const { Option } = Select

export default function GenerateChecklistPage() {
  const router = useRouter()
  const { generateChecklistFromAPI, isLoading, error } = useChecklistStore()
  const [form] = Form.useForm()

  const handleGenerate = async (values: any) => {
    try {
      // 构造身份信息
      const identityInfo = createIdentityInfo(values.employmentStatus, {
        incomeSources: values.incomeSources || ['salary'],
        hasDependents: values.hasDependents || false,
        hasInvestment: values.hasInvestment || false,
        hasRentalProperty: values.hasRentalProperty || false,
        isFirstTimeFiler: values.isFirstTimeFiler || false,
        additionalInfo: {
          industry: values.industry,
          location: values.location,
          has_home_office: values.hasHomeOffice || false,
        },
      })

      // 调用 API 生成清单（使用固定的测试用户 ID）
      await generateChecklistFromAPI(1, identityInfo)

      message.success('🎉 个性化清单生成成功！')
      
      // 跳转到清单页面
      setTimeout(() => {
        router.push('/checklist')
      }, 1000)
    } catch (err) {
      message.error('生成清单失败，请重试')
      console.error('Generate checklist error:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Card className="mb-6 shadow-lg">
          <div className="text-center">
            <RocketOutlined className="mb-4 text-6xl text-primary-600" />
            <Title level={2} className="mb-2">
              Generate Personalized Tax Checklist
            </Title>
            <Paragraph className="text-gray-600">
              Based on your specific situation, AI will generate a customized tax preparation checklist for you
            </Paragraph>
          </div>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            closable
            className="mb-6"
          />
        )}

        {/* Form */}
        <Card className="shadow-lg">
          <Spin spinning={isLoading} tip="AI is generating your personalized checklist...">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleGenerate}
              initialValues={{
                employmentStatus: 'employed',
                incomeSources: ['salary'],
                hasDependents: false,
                hasInvestment: false,
                hasRentalProperty: false,
                isFirstTimeFiler: false,
                hasHomeOffice: false,
              }}
            >
              {/* Employment Status */}
              <Form.Item
                label={
                  <span>
                    <UserOutlined className="mr-2" />
                    Employment Status
                  </span>
                }
                name="employmentStatus"
                rules={[{ required: true, message: 'Please select employment status' }]}
              >
                <Select size="large">
                  <Option value="employed">Employed</Option>
                  <Option value="self_employed">Self-Employed</Option>
                  <Option value="unemployed">Unemployed</Option>
                  <Option value="retired">Retired</Option>
                </Select>
              </Form.Item>

              {/* Income Sources */}
              <Form.Item
                label={
                  <span>
                    <DollarOutlined className="mr-2" />
                    Income Sources (Multiple Selection)
                  </span>
                }
                name="incomeSources"
                rules={[
                  {
                    required: true,
                    message: 'Please select at least one income source',
                    type: 'array',
                  },
                ]}
              >
                <Select mode="multiple" size="large" placeholder="Select income sources">
                  <Option value="salary">Salary/Wages</Option>
                  <Option value="investment">Investment Income</Option>
                  <Option value="rental">Rental Income</Option>
                  <Option value="pension">Pension</Option>
                  <Option value="other">Other Income</Option>
                </Select>
              </Form.Item>

              {/* Industry (Optional) */}
              <Form.Item
                label="Industry (Optional)"
                name="industry"
                tooltip="Helps AI generate more accurate recommendations"
              >
                <Select size="large" placeholder="Select your industry" allowClear>
                  <Option value="technology">Technology</Option>
                  <Option value="healthcare">Healthcare</Option>
                  <Option value="education">Education</Option>
                  <Option value="finance">Finance</Option>
                  <Option value="retail">Retail</Option>
                  <Option value="construction">Construction</Option>
                  <Option value="other">Other</Option>
                </Select>
              </Form.Item>

              {/* Location (Optional) */}
              <Form.Item
                label="Location (Optional)"
                name="location"
                tooltip="Different regions may have different tax requirements"
              >
                <Select size="large" placeholder="Select your location" allowClear>
                  <Option value="NSW">New South Wales (NSW)</Option>
                  <Option value="VIC">Victoria (VIC)</Option>
                  <Option value="QLD">Queensland (QLD)</Option>
                  <Option value="WA">Western Australia (WA)</Option>
                  <Option value="SA">South Australia (SA)</Option>
                  <Option value="TAS">Tasmania (TAS)</Option>
                  <Option value="ACT">Australian Capital Territory (ACT)</Option>
                  <Option value="NT">Northern Territory (NT)</Option>
                </Select>
              </Form.Item>

              {/* Additional Information */}
              <div className="mb-4 rounded-lg bg-gray-50 p-4">
                <Text strong className="mb-3 block">
                  <HomeOutlined className="mr-2" />
                  Additional Information
                </Text>
                <Space direction="vertical" size="small">
                  <Form.Item name="hasDependents" valuePropName="checked" noStyle>
                    <Checkbox>Have dependents (children, parents, etc.)</Checkbox>
                  </Form.Item>
                  <Form.Item name="hasInvestment" valuePropName="checked" noStyle>
                    <Checkbox>Have investment assets (stocks, funds, etc.)</Checkbox>
                  </Form.Item>
                  <Form.Item name="hasRentalProperty" valuePropName="checked" noStyle>
                    <Checkbox>Have rental property</Checkbox>
                  </Form.Item>
                  <Form.Item name="hasHomeOffice" valuePropName="checked" noStyle>
                    <Checkbox>Have home office</Checkbox>
                  </Form.Item>
                  <Form.Item name="isFirstTimeFiler" valuePropName="checked" noStyle>
                    <Checkbox>First time filing tax return</Checkbox>
                  </Form.Item>
                </Space>
              </div>

              {/* Submit Button */}
              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={isLoading}
                  icon={<RocketOutlined />}
                >
                  Generate Personalized Checklist
                </Button>
              </Form.Item>
            </Form>
          </Spin>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 shadow-lg">
          <div className="text-center">
            <Text className="text-sm text-gray-600">
              💡 <strong>Tip:</strong>
              AI will generate 5-15 personalized tax preparation tasks based on the information you provide.
              The more detailed the information, the more accurate the checklist!
            </Text>
          </div>
        </Card>
      </div>
    </div>
  )
}
