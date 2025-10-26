'use client'

import { Button, Typography, Card, Row, Col } from 'antd'
import {
  MessageOutlined,
  CheckSquareOutlined,
  CalculatorOutlined,
  RocketOutlined,
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
            Your intelligent AI-powered tax assistant. Get instant answers,
            create checklists, and calculate taxes with ease.
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
                Try Calculator
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
              <Title level={3}>AI Chat Assistant</Title>
              <Paragraph className="text-gray-600">
                Get instant answers to your tax questions with our intelligent
                AI chatbot powered by advanced language models.
              </Paragraph>
              <Link href="/chat">
                <Button type="link">Try Chat →</Button>
              </Link>
            </Card>
          </Col>

          <Col xs={24} md={8}>
            <Card
              hoverable
              className="h-full text-center transition-all hover:shadow-xl"
            >
              <CheckSquareOutlined className="mb-4 text-6xl text-green-500" />
              <Title level={3}>Tax Checklist</Title>
              <Paragraph className="text-gray-600">
                Never miss important tax deadlines and requirements. Our
                comprehensive checklist keeps you organized.
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
                Calculate your taxes accurately with our easy-to-use calculator.
                Get instant estimates and plan ahead.
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
            Why Choose ChatTax?
          </Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <div className="mb-4">
                <Title level={4}>🚀 Fast & Efficient</Title>
                <Paragraph>
                  Get instant answers and calculations without the wait. Our AI
                  processes your queries in real-time.
                </Paragraph>
              </div>
              <div className="mb-4">
                <Title level={4}>🔒 Secure & Private</Title>
                <Paragraph>
                  Your data is encrypted and secure. We prioritize your privacy
                  and never share your information.
                </Paragraph>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="mb-4">
                <Title level={4}>📊 Accurate Results</Title>
                <Paragraph>
                  Our calculations are based on the latest tax regulations and
                  are continuously updated.
                </Paragraph>
              </div>
              <div className="mb-4">
                <Title level={4}>💡 Easy to Use</Title>
                <Paragraph>
                  No tax expertise required. Our intuitive interface makes tax
                  management simple for everyone.
                </Paragraph>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  )
}
