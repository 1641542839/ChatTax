'use client'

import { Button, Typography, Card, Row, Col } from 'antd'
import {
  MessageOutlined,
  CheckSquareOutlined,
  CalculatorOutlined,
  RocketOutlined,
  LoginOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import Link from 'next/link'

const { Title, Paragraph } = Typography

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <Title level={1} className="mb-4 text-5xl font-bold text-gray-900">
            Welcome to <span className="text-primary-600">ChatTax</span>
          </Title>
          <Paragraph className="mx-auto max-w-2xl text-xl text-gray-600">
            Your AI-powered tax companion for Australian taxpayers. Lodge your return with confidence using intelligent guidance, personalized checklists, and accurate calculations.
          </Paragraph>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/chat">
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                className="h-12 px-8 text-lg"
              >
                Get Started
              </Button>
            </Link>
            <Link href="/calculator">
              <Button size="large" className="h-12 px-8 text-lg">
                Tax Calculator
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <Row gutter={[24, 24]} className="mb-16">
          <Col xs={24} md={8}>
            <Card
              hoverable
              className="h-full text-center transition-all hover:shadow-xl"
            >
              <MessageOutlined className="mb-4 text-6xl text-primary-500" />
              <Title level={3}>AI Smart Assistant</Title>
              <Paragraph className="text-gray-600">
                Chat with your personal tax expert 24/7. Get instant answers to complex tax questions in plain English. Powered by GPT-4, trained on Australian tax law and ATO guidelines.
              </Paragraph>
              <Link href="/chat">
                <Button type="link">Start Chatting →</Button>
              </Link>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              hoverable
              className="h-full text-center transition-all hover:shadow-xl"
            >
              <CheckSquareOutlined className="mb-4 text-6xl text-green-500" />
              <Title level={3}>Personalized Checklist</Title>
              <Paragraph className="text-gray-600">
                Your tailored tax prep roadmap. Get a smart checklist customized to your income, deductions, and situation. Never miss important documents or deadlines—lodge with confidence!
              </Paragraph>
              <Link href="/checklist">
                <Button type="link">View Checklist →</Button>
              </Link>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              hoverable
              className="h-full text-center transition-all hover:shadow-xl"
            >
              <CalculatorOutlined className="mb-4 text-6xl text-orange-500" />
              <Title level={3}>Tax Calculator</Title>
              <Paragraph className="text-gray-600">
                Know your refund or tax bill in seconds! Our smart calculator handles PAYG, offsets, Medicare levy, and HECS-HELP. Plan ahead and avoid surprises at tax time.
              </Paragraph>
              <Link href="/calculator">
                <Button type="link">Calculate Now →</Button>
              </Link>
            </Card>
          </Col>
        </Row>

        {/* Info Section */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <Title level={2} className="mb-4 text-center">
            Why Aussies Love ChatTax
          </Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <div className="mb-4">
                <Title level={4}>🚀 Lightning Fast Results</Title>
                <Paragraph>
                  Get instant answers and tax calculations in seconds. No waiting rooms, no phone queues—just immediate, accurate help when you need it.
                </Paragraph>
              </div>
              <div className="mb-4">
                <Title level={4}>🇦🇺 Built for Australian Taxpayers</Title>
                <Paragraph>
                  Designed exclusively for Aussie individual tax returns. Fully aligned with ATO requirements, tax rates, and local deductions you can actually claim.
                </Paragraph>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="mb-4">
                <Title level={4}>📊 Accurate & Up-to-Date</Title>
                <Paragraph>
                  Always current with the latest tax laws and ATO updates. Get reliable calculations and advice you can trust for your 2024-25 return.
                </Paragraph>
              </div>
              <div className="mb-4">
                <Title level={4}>💡 No Tax Jargon, Just Clarity</Title>
                <Paragraph>
                  Tax made simple. Our friendly interface breaks down complex concepts into plain English. Perfect for first-time filers and seasoned pros alike.
                </Paragraph>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  )
}
