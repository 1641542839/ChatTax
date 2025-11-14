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
  Input,
  InputNumber,
  Radio,
  Divider,
} from 'antd'
import {
  RocketOutlined,
  UserOutlined,
  DollarOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  BankOutlined,
} from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const { Option } = Select
const { TextArea } = Input

export default function GenerateChecklistPage() {
  const router = useRouter()
  const { generateChecklistFromAPI, isLoading, error } = useChecklistStore()
  const [form] = Form.useForm()

  const handleGenerate = async (values: any) => {
    try {
      // Construct identity information
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
          has_foreign_income: values.hasForeignIncome || false,
          has_charity_donations: values.hasCharityDonations || false,
          has_education_expenses: values.hasEducationExpenses || false,
          has_vehicle_expenses: values.hasVehicleExpenses || false,
          number_of_dependents: values.numberOfDependents,
          number_of_properties: values.numberOfProperties,
          additional_notes: values.additionalNotes,
        },
      })

      // Generate checklist via API
      await generateChecklistFromAPI(1, identityInfo)

      message.success('🎉 Personalized Australian tax checklist generated successfully!')
      
      // Navigate to checklist page
      setTimeout(() => {
        router.push('/checklist')
      }, 1000)
    } catch (err) {
      message.error('Failed to generate checklist. Please try again.')
      console.error('Generate checklist error:', err)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '3rem 0',
    }}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Card 
          className="mb-6" 
          style={{
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: 'none',
            overflow: 'hidden',
          }}
        >
          <div style={{
            textAlign: 'center',
            padding: '2rem 1rem',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              marginBottom: '1.5rem',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
            }}>
              <RocketOutlined style={{ fontSize: '40px', color: 'white' }} />
            </div>
            <Title level={2} style={{ marginBottom: '0.5rem', fontSize: '32px' }}>
              Generate Personalized Australian Tax Checklist
            </Title>
            <Paragraph style={{ color: '#64748b', fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
              Fill in your tax situation details below, and our AI will create a customized Australian tax return checklist for you
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
        <Card 
          style={{
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: 'none',
          }}
          bodyStyle={{ padding: '3rem' }}
        >
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
                hasForeignIncome: false,
                hasCharityDonations: false,
                hasEducationExpenses: false,
                hasVehicleExpenses: false,
              }}
            >
              {/* Employment Status */}
              <Form.Item
                label={
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                    <UserOutlined style={{ marginRight: '8px', color: '#667eea' }} />
                    Employment Status
                  </span>
                }
                name="employmentStatus"
                rules={[{ required: true, message: 'Please select employment status' }]}
              >
                <Select 
                  size="large"
                  style={{ borderRadius: '8px' }}
                  placeholder="Select your employment status"
                >
                  <Option value="employed">💼 Employed (PAYG Employee)</Option>
                  <Option value="self_employed">👨‍💼 Self-Employed / Sole Trader</Option>
                  <Option value="contractor">📋 Contractor</Option>
                  <Option value="retired">🏖️ Retired (Pension/Superannuation)</Option>
                  <Option value="student">🎓 Student</Option>
                  <Option value="unemployed">🔍 Unemployed (Centrelink)</Option>
                </Select>
              </Form.Item>

              {/* Income Sources */}
              <Form.Item
                label={
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                    <DollarOutlined style={{ marginRight: '8px', color: '#10b981' }} />
                    Income Sources (select all that apply)
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
                <Select 
                  mode="multiple" 
                  size="large" 
                  placeholder="Select all income sources for 2023-24 financial year"
                  style={{ borderRadius: '8px' }}
                >
                  <Option value="salary">💰 Salary/Wages (PAYG Income)</Option>
                  <Option value="self_employment">👨‍💼 Business/Sole Trader Income</Option>
                  <Option value="investment">📈 Investment Income (Dividends, Capital Gains, Interest)</Option>
                  <Option value="rental">🏠 Rental Property Income</Option>
                  <Option value="superannuation">👴 Superannuation/Pension Income</Option>
                  <Option value="foreign">🌏 Foreign Income</Option>
                  <Option value="government">💼 Government Payments (Centrelink)</Option>
                  <Option value="other">📋 Other Income</Option>
                </Select>
              </Form.Item>

              {/* Residency Status for Australian Tax */}
              <Form.Item
                label={
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                    <BankOutlined style={{ marginRight: '8px', color: '#f59e0b' }} />
                    Residency Status for Tax Purposes
                  </span>
                }
                name="residencyStatus"
                tooltip="Your residency status affects your tax rate and entitlements"
                rules={[{ required: true, message: 'Please select residency status' }]}
              >
                <Select 
                  size="large" 
                  placeholder="Select your residency status" 
                  style={{ borderRadius: '8px' }}
                >
                  <Option value="resident">🇦🇺 Australian Resident for Tax Purposes</Option>
                  <Option value="foreign_resident">🌏 Foreign Resident</Option>
                  <Option value="working_holiday_maker">✈️ Working Holiday Maker</Option>
                </Select>
              </Form.Item>

              <Divider orientation="left">
                <Text strong style={{ fontSize: '16px' }}>
                  <HomeOutlined className="mr-2" />
                  Family & Dependents
                </Text>
              </Divider>

              {/* Family & Dependents */}
              <Card 
                size="small" 
                style={{ marginBottom: '16px', background: '#f0f9ff', border: '1px solid #bae7ff' }}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Form.Item name="hasDependents" valuePropName="checked" noStyle>
                    <Checkbox style={{ fontSize: '15px', fontWeight: '500' }}>
                      👶 Have qualifying dependents (children under 17, qualifying relatives)
                    </Checkbox>
                  </Form.Item>
                  
                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => 
                      prevValues.hasDependents !== currentValues.hasDependents
                    }
                  >
                    {({ getFieldValue }) =>
                      getFieldValue('hasDependents') ? (
                        <Form.Item
                          name="numberOfDependents"
                          label="Number of Dependents"
                          style={{ marginBottom: 0 }}
                          tooltip="Include children under 17 and other qualifying dependents"
                        >
                          <InputNumber 
                            min={0} 
                            max={20} 
                            placeholder="Enter number" 
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      ) : null
                    }
                  </Form.Item>

                  <Form.Item name="hasChildCareExpenses" valuePropName="checked" noStyle>
                    <Checkbox style={{ fontSize: '15px', fontWeight: '500' }}>
                      👨‍👩‍👧 Paid for child care or dependent care (for work purposes)
                    </Checkbox>
                  </Form.Item>

                  <Form.Item name="hasAdoptionExpenses" valuePropName="checked" noStyle>
                    <Checkbox style={{ fontSize: '15px', fontWeight: '500' }}>
                      👪 Paid adoption expenses this year
                    </Checkbox>
                  </Form.Item>
                </Space>
              </Card>

              <Divider orientation="left">
                <Text strong style={{ fontSize: '16px' }}>
                  Investment & Property
                </Text>
              </Divider>

              {/* Investment & Property */}
              <Card 
                size="small" 
                style={{ marginBottom: '16px', background: '#fff7e6', border: '1px solid #ffd591' }}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Form.Item name="hasInvestment" valuePropName="checked" noStyle>
                    <Checkbox style={{ fontSize: '15px', fontWeight: '500' }}>
                      📈 Have investments (shares, managed funds, etc.)
                    </Checkbox>
                  </Form.Item>

                  <Form.Item name="hasCryptoCurrency" valuePropName="checked" noStyle>
                    <Checkbox style={{ fontSize: '15px', fontWeight: '500' }}>
                      ₿ Traded cryptocurrency (capital gains/losses)
                    </Checkbox>
                  </Form.Item>
                  
                  <Form.Item name="hasRentalProperty" valuePropName="checked" noStyle>
                    <Checkbox style={{ fontSize: '15px', fontWeight: '500' }}>
                      🏠 Own rental/investment property
                    </Checkbox>
                  </Form.Item>

                  <Form.Item
                    noStyle
                    shouldUpdate={(prevValues, currentValues) => 
                      prevValues.hasRentalProperty !== currentValues.hasRentalProperty
                    }
                  >
                    {({ getFieldValue }) =>
                      getFieldValue('hasRentalProperty') ? (
                        <Form.Item
                          name="numberOfProperties"
                          label="Number of Rental Properties"
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber 
                            min={0} 
                            max={50} 
                            placeholder="Enter number" 
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      ) : null
                    }
                  </Form.Item>

                  <Form.Item name="hasSoldHome" valuePropName="checked" noStyle>
                    <Checkbox style={{ fontSize: '15px', fontWeight: '500' }}>
                      🏡 Sold investment property (capital gains)
                    </Checkbox>
                  </Form.Item>

                  <Form.Item name="hasSuperContributions" valuePropName="checked" noStyle>
                    <Checkbox style={{ fontSize: '15px', fontWeight: '500' }}>
                      💰 Made personal superannuation contributions
                    </Checkbox>
                  </Form.Item>
                </Space>
              </Card>

              <Divider orientation="left">
                <Text strong style={{ fontSize: '16px' }}>
                  Deductions & Offsets
                </Text>
              </Divider>

              {/* Deductions & Credits */}
              <Card 
                size="small" 
                style={{ marginBottom: '16px', background: '#f6ffed', border: '1px solid #b7eb8f' }}
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Form.Item name="hasWorkExpenses" valuePropName="checked" noStyle>
                    <Checkbox style={{ fontSize: '15px', fontWeight: '500' }}>
                      💼 Work-related expenses (tools, uniforms, car, etc.)
                    </Checkbox>
                  </Form.Item>

                  <Form.Item name="hasHomeOffice" valuePropName="checked" noStyle>
                    <Checkbox style={{ fontSize: '15px', fontWeight: '500' }}>
                      🏠 Home office expenses (if working from home)
                    </Checkbox>
                  </Form.Item>

                  <Form.Item name="hasCharityDonations" valuePropName="checked" noStyle>
                    <Checkbox style={{ fontSize: '15px', fontWeight: '500' }}>
                      ❤️ Donations to DGRs (Deductible Gift Recipients)
                    </Checkbox>
                  </Form.Item>

                  <Form.Item name="hasPrivateHealthInsurance" valuePropName="checked" noStyle>
                    <Checkbox style={{ fontSize: '15px', fontWeight: '500' }}>
                      🏥 Have private health insurance
                    </Checkbox>
                  </Form.Item>

                  <Form.Item name="hasHECSDebt" valuePropName="checked" noStyle>
                    <Checkbox style={{ fontSize: '15px', fontWeight: '500' }}>
                      🎓 HECS/HELP debt (student loan)
                    </Checkbox>
                  </Form.Item>

                  <Form.Item name="hasForeignIncome" valuePropName="checked" noStyle>
                    <Checkbox style={{ fontSize: '15px', fontWeight: '500' }}>
                      🌏 Foreign income or assets
                    </Checkbox>
                  </Form.Item>
                </Space>
              </Card>

              {/* Filing Status */}
              <Card 
                size="small" 
                style={{ marginBottom: '16px', background: '#fff0f6', border: '1px solid #ffadd2' }}
              >
                <Form.Item name="isFirstTimeFiler" valuePropName="checked" noStyle>
                  <Checkbox style={{ fontSize: '15px', fontWeight: '500' }}>
                    First time filing tax return
                  </Checkbox>
                </Form.Item>
              </Card>

              <Divider orientation="left">
                <Text strong style={{ fontSize: '16px' }}>
                  <InfoCircleOutlined className="mr-2" />
                  Additional Information (Optional)
                </Text>
              </Divider>

              {/* Free Text Input */}
              <Form.Item
                name="additionalNotes"
                label={
                  <span style={{ fontSize: '15px', fontWeight: '500' }}>
                    Any other relevant information?
                  </span>
                }
                tooltip="Add any special circumstances, concerns, or questions you have about your tax situation"
              >
                <TextArea
                  rows={4}
                  placeholder="E.g., 'I changed jobs mid-year', 'I have capital gains from crypto', 'Need to claim medical expenses', etc."
                  maxLength={500}
                  showCount
                  style={{ fontSize: '14px' }}
                />
              </Form.Item>

              {/* Submit Button */}
              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  block
                  loading={isLoading}
                  icon={<RocketOutlined />}
                  style={{
                    height: '56px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    boxShadow: '0 4px 16px rgba(102, 126, 234, 0.4)',
                  }}
                >
                  Generate Personalized Checklist
                </Button>
              </Form.Item>
            </Form>
          </Spin>
        </Card>

        {/* Info Card */}
        <Card 
          style={{
            marginTop: '2rem',
            borderRadius: '16px',
            background: 'rgba(255,255,255,0.95)',
            border: '2px solid rgba(102, 126, 234, 0.2)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <Text style={{ fontSize: '15px', color: '#475569', lineHeight: '1.8' }}>
              💡 <strong style={{ color: '#667eea' }}>Smart Tip:</strong> Our AI will generate 10-20 personalized tax preparation tasks based on your situation. The more details you provide, the more accurate and helpful your checklist will be!
            </Text>
          </div>
        </Card>
      </div>
    </div>
  )
}
