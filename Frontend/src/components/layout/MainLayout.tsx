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
  FileTextOutlined,
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
          key: '/checklist/generate',
          icon: <FormOutlined />,
          label: 'Form Mode',
          onClick: () => router.push('/checklist/generate'),
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
      key: '/checklists',
      icon: <FileTextOutlined />,
      label: 'My Checklists',
      onClick: () => router.push('/checklists'),
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
    if (pathname.startsWith('/checklist/generate')) return ['/checklist/generate']
    if (pathname.startsWith('/checklist') && !pathname.startsWith('/checklists')) return ['/checklist']
    if (pathname.startsWith('/checklists')) return ['/checklists']
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
        width={260}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 64, // Height of Navbar
          bottom: 0,
          zIndex: 100,
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          borderRight: '2px solid #e2e8f0',
          boxShadow: '4px 0 24px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            padding: '20px',
            borderBottom: '2px solid #e2e8f0',
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'flex-end',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            style={{
              fontSize: '18px',
              width: 40,
              height: 40,
              color: 'white',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
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
            height: 'calc(100% - 81px)',
            background: 'transparent',
            fontSize: '15px',
            fontWeight: '500',
          }}
          theme="light"
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 260, transition: 'margin-left 0.2s' }}>
        <Content
          style={{
            marginTop: 64, // Height of Navbar
            padding: 0,
            minHeight: 'calc(100vh - 64px)',
            background: '#f5f7fa',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
