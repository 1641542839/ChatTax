'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'antd'
import {
  HomeOutlined,
  MessageOutlined,
  CheckSquareOutlined,
  CalculatorOutlined,
} from '@ant-design/icons'

const Navbar = () => {
  const pathname = usePathname()

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link href="/">Home</Link>,
    },
    {
      key: '/chat',
      icon: <MessageOutlined />,
      label: <Link href="/chat">AI Assistant</Link>,
    },
    {
      key: '/checklist',
      icon: <CheckSquareOutlined />,
      label: <Link href="/checklist">Tax Checklist</Link>,
    },
    {
      key: '/calculator',
      icon: <CalculatorOutlined />,
      label: <Link href="/calculator">Tax Calculator</Link>,
    },
  ]

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center py-4 text-2xl font-bold text-primary-600"
          >
            <span className="mr-2 text-3xl">💼</span>
            ChatTax
          </Link>
          <Menu
            mode="horizontal"
            selectedKeys={[pathname]}
            items={menuItems}
            className="flex-1 justify-end border-0"
            style={{ minWidth: 0 }}
          />
        </div>
      </div>
    </nav>
  )
}

export default Navbar
