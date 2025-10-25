'use client'

import { useState } from 'react'
import {
  Card,
  Typography,
  Form,
  InputNumber,
  Select,
  Button,
  Divider,
  Space,
  Alert,
  Row,
  Col,
  Statistic,
} from 'antd'
import { CalculatorOutlined, DollarOutlined } from '@ant-design/icons'

const { Title, Paragraph, Text } = Typography
const { Option } = Select

interface TaxResult {
  grossIncome: number
  standardDeduction: number
  taxableIncome: number
  federalTax: number
  stateTax: number
  totalTax: number
  effectiveRate: number
  takeHome: number
}

export default function CalculatorPage() {
  const [form] = Form.useForm()
  const [result, setResult] = useState<TaxResult | null>(null)

  const calculateTax = (values: {
    income: number
    filingStatus: string
    stateRate: number
  }) => {
    const { income, filingStatus, stateRate } = values

    // Standard deductions for 2024 (simplified)
    const standardDeductions: { [key: string]: number } = {
      single: 14600,
      married: 29200,
      head: 21900,
    }

    const standardDeduction = standardDeductions[filingStatus] || 14600
    const taxableIncome = Math.max(income - standardDeduction, 0)

    // Federal tax brackets (simplified for 2024)
    let federalTax = 0
    if (filingStatus === 'single') {
      if (taxableIncome <= 11600) {
        federalTax = taxableIncome * 0.1
      } else if (taxableIncome <= 47150) {
        federalTax = 1160 + (taxableIncome - 11600) * 0.12
      } else if (taxableIncome <= 100525) {
        federalTax = 5426 + (taxableIncome - 47150) * 0.22
      } else if (taxableIncome <= 191950) {
        federalTax = 17168.5 + (taxableIncome - 100525) * 0.24
      } else if (taxableIncome <= 243725) {
        federalTax = 39110.5 + (taxableIncome - 191950) * 0.32
      } else if (taxableIncome <= 609350) {
        federalTax = 55678.5 + (taxableIncome - 243725) * 0.35
      } else {
        federalTax = 183647.25 + (taxableIncome - 609350) * 0.37
      }
    } else {
      // Simplified calculation for other statuses
      federalTax = taxableIncome * 0.22 // Average rate
    }

    const stateTax = taxableIncome * (stateRate / 100)
    const totalTax = federalTax + stateTax
    const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0
    const takeHome = income - totalTax

    setResult({
      grossIncome: income,
      standardDeduction,
      taxableIncome,
      federalTax,
      stateTax,
      totalTax,
      effectiveRate,
      takeHome,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Card className="shadow-xl">
          <div className="mb-6">
            <Title level={2} className="mb-2">
              🧮 Tax Calculator
            </Title>
            <Paragraph className="text-gray-600">
              Estimate your federal and state income taxes
            </Paragraph>
          </div>

          <Alert
            message="Disclaimer"
            description="This calculator provides estimates based on simplified tax brackets. For accurate tax filing, consult a tax professional or use official IRS tools."
            type="info"
            showIcon
            className="mb-6"
          />

          <Divider />

          <Row gutter={24}>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <Space>
                    <CalculatorOutlined />
                    <Text>Tax Information</Text>
                  </Space>
                }
                className="h-full"
              >
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={calculateTax}
                  initialValues={{
                    income: 75000,
                    filingStatus: 'single',
                    stateRate: 5,
                  }}
                >
                  <Form.Item
                    label="Annual Gross Income"
                    name="income"
                    rules={[
                      {
                        required: true,
                        message: 'Please enter your income',
                      },
                    ]}
                  >
                    <InputNumber
                      className="w-full"
                      min={0}
                      max={10000000}
                      step={1000}
                      prefix="$"
                      formatter={(value) =>
                        `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                      }
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Filing Status"
                    name="filingStatus"
                    rules={[
                      {
                        required: true,
                        message: 'Please select filing status',
                      },
                    ]}
                  >
                    <Select size="large">
                      <Option value="single">Single</Option>
                      <Option value="married">Married Filing Jointly</Option>
                      <Option value="head">Head of Household</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="State Tax Rate (%)"
                    name="stateRate"
                    rules={[
                      {
                        required: true,
                        message: 'Please enter state tax rate',
                      },
                    ]}
                  >
                    <InputNumber
                      className="w-full"
                      min={0}
                      max={15}
                      step={0.1}
                      suffix="%"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      block
                      icon={<CalculatorOutlined />}
                    >
                      Calculate Taxes
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              {result ? (
                <Card
                  title={
                    <Space>
                      <DollarOutlined />
                      <Text>Tax Calculation Results</Text>
                    </Space>
                  }
                  className="h-full"
                >
                  <Space direction="vertical" size="large" className="w-full">
                    <div className="rounded-lg bg-blue-50 p-4">
                      <Statistic
                        title="Gross Income"
                        value={result.grossIncome}
                        precision={2}
                        prefix="$"
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </div>

                    <Divider className="my-2" />

                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="Standard Deduction"
                          value={result.standardDeduction}
                          precision={2}
                          prefix="$"
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="Taxable Income"
                          value={result.taxableIncome}
                          precision={2}
                          prefix="$"
                        />
                      </Col>
                    </Row>

                    <Divider className="my-2" />

                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="Federal Tax"
                          value={result.federalTax}
                          precision={2}
                          prefix="$"
                          valueStyle={{ color: '#cf1322' }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="State Tax"
                          value={result.stateTax}
                          precision={2}
                          prefix="$"
                          valueStyle={{ color: '#cf1322' }}
                        />
                      </Col>
                    </Row>

                    <Divider className="my-2" />

                    <div className="rounded-lg bg-red-50 p-4">
                      <Statistic
                        title="Total Tax"
                        value={result.totalTax}
                        precision={2}
                        prefix="$"
                        valueStyle={{ color: '#cf1322', fontSize: '24px' }}
                      />
                      <Text type="secondary" className="text-sm">
                        Effective Rate: {result.effectiveRate.toFixed(2)}%
                      </Text>
                    </div>

                    <div className="rounded-lg bg-green-50 p-4">
                      <Statistic
                        title="Take Home Pay"
                        value={result.takeHome}
                        precision={2}
                        prefix="$"
                        valueStyle={{ color: '#3f8600', fontSize: '24px' }}
                      />
                    </div>
                  </Space>
                </Card>
              ) : (
                <Card className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <CalculatorOutlined className="mb-4 text-6xl text-gray-300" />
                    <Text type="secondary">
                      Enter your information and click Calculate to see results
                    </Text>
                  </div>
                </Card>
              )}
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  )
}
