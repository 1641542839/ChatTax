'use client'

import { useState, useEffect } from 'react'
import { Layout, Menu, Button } from 'antd'
import { usePathname, useRouter } from 'next/navigation'
import {
  HomeOutlined,
  MessageOutlined,
  CheckSquareOutlined,
  CalculatorOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  FormOutlined,
  CommentOutlined,
  WechatOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'

const { Sider, Content } = Layout

interface MainLayoutProps {
  children: React.ReactNode
}

type MenuItem = Required<MenuProps>['items'][number]

const MainLayout = ({ children }: MainLayoutProps) => {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load collapsed state from localStorage
    const savedCollapsed = localStorage.getItem('sidebarCollapsed')
    if (savedCollapsed !== null) {
      setCollapsed(savedCollapsed === 'true')
    }
  }, [])

  const toggleCollapsed = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    localStorage.setItem('sidebarCollapsed', String(newCollapsed))
  }

  const menuItems: MenuItem[] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Home',
      onClick: () => router.push('/'),
    },
    {
      key: 'checklist-group',
      icon: <CheckSquareOutlined />,
      label: 'Tax Checklist',
      children: [
        {
          key: '/checklist',
          icon: <FormOutlined />,
          label: 'Form Mode',
          onClick: () => router.push('/checklist'),
        },
        {
          key: '/checklist/guided',
          icon: <CommentOutlined />,
          label: 'Guided Chat',
          onClick: () => router.push('/checklist/guided'),
        },
        {
          key: '/chat',
          icon: <WechatOutlined />,
          label: 'Free Chat',
          onClick: () => router.push('/chat'),
        },
      ],
    },
    {
      key: '/calculator',
      icon: <CalculatorOutlined />,
      label: 'Tax Calculator',
      onClick: () => router.push('/calculator'),
    },
  ]

  // Determine selected and open keys based on pathname
  const getSelectedKeys = (): string[] => {
    if (pathname === '/') return ['/']
    if (pathname.startsWith('/checklist/guided')) return ['/checklist/guided']
    if (pathname.startsWith('/checklist')) return ['/checklist']
    if (pathname.startsWith('/chat')) return ['/chat']
    if (pathname.startsWith('/calculator')) return ['/calculator']
    return []
  }

  const getOpenKeys = (): string[] => {
    if (
      pathname.startsWith('/checklist') ||
      pathname.startsWith('/chat')
    ) {
      return ['checklist-group']
    }
    return []
  }

  // Don't render sidebar on auth pages
  const isAuthPage =
    pathname === '/login' || pathname === '/register'

  if (!mounted || isAuthPage) {
    return <>{children}</>
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={toggleCollapsed}
        trigger={null}
        width={240}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 64, // Height of Navbar
          bottom: 0,
          zIndex: 100,
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
        }}
      >
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'flex-end',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            style={{
              fontSize: '16px',
              width: 32,
              height: 32,
            }}
          />
        </div>
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          items={menuItems}
          style={{
            borderRight: 0,
            height: 'calc(100% - 65px)',
          }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s' }}>
        <Content
          style={{
            marginTop: 64, // Height of Navbar
            padding: '24px',
            minHeight: 'calc(100vh - 64px)',
            background: '#f0f2f5',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
