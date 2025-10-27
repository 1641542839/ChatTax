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
            Your intelligent personal tax return assistant. Get instant answers, create personalized checklists, and easily complete your Australian individual tax return.
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
                Get instant answers to your personal tax return questions using our AI chatbot. Powered by GPT-4 technology, specialized in Australian tax law.
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
                Generate a customized tax preparation checklist based on your personal situation. Never miss important documents and deadlines.
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
                Accurately calculate your personal income tax using our easy-to-use calculator. Get instant estimates and plan your tax ahead.
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
                  Get instant answers and calculation results. Our AI processes your queries in real-time with no waiting.
                </Paragraph>
              </div>
              <div className="mb-4">
                <Title level={4}>🇦🇺 Focused on Australian Personal Tax</Title>
                <Paragraph>
                  Specially designed for Australian individual taxpayers. Fully compliant with ATO (Australian Taxation Office) regulations and requirements.
                </Paragraph>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div className="mb-4">
                <Title level={4}>📊 Accurate & Reliable</Title>
                <Paragraph>
                  Based on the latest Australian tax laws and continuously updated. Ensures your calculations and advice are accurate and error-free.
                </Paragraph>
              </div>
              <div className="mb-4">
                <Title level={4}>💡 Simple & Easy to Use</Title>
                <Paragraph>
                  No tax expertise required. Intuitive interface makes managing personal tax returns simple for everyone.
                </Paragraph>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  )
}
