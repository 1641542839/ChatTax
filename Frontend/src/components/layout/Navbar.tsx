'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, Dropdown, Button, Space, message } from 'antd'
import type { MenuProps } from 'antd'
import {
  LoginOutlined,
  UserAddOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons'

interface User {
  id: string
  username: string
  email: string
  full_name?: string
  avatar_url?: string
}

const Navbar = () => {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchUserInfo(token)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        // Token invalid, clear it
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    message.success('Logged out successfully')
    router.push('/')
  }

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <div>
          <div style={{ fontWeight: 500 }}>
            {user?.full_name || user?.username}
          </div>
          <div style={{ fontSize: 12, color: '#666' }}>{user?.email}</div>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => router.push('/settings'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
      danger: true,
    },
  ]

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        zIndex: 1001,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #f0f0f0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      }}
    >
      <div
        style={{
          maxWidth: '100%',
          height: '100%',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            padding: '12px 0',
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px',
            }}
          >
            ChatTax
          </div>
        </Link>

        {/* Right side - Login/Register or User Avatar */}
        <div style={{ marginLeft: 'auto' }}>
          {loading ? null : user ? (
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              arrow
            >
              <Avatar
                size={40}
                src={user.avatar_url}
                icon={!user.avatar_url && <UserOutlined />}
                style={{
                  cursor: 'pointer',
                  backgroundColor: user.avatar_url ? undefined : '#667eea',
                  border: '2px solid #f0f0f0',
                }}
              />
            </Dropdown>
          ) : (
            <Space size="middle">
              <Link href="/login">
                <Button
                  type="text"
                  icon={<LoginOutlined />}
                  size="large"
                  style={{
                    color: '#666',
                    fontWeight: 500,
                  }}
                >
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button
                  type="primary"
                  icon={<UserAddOutlined />}
                  size="large"
                  style={{
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 500,
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  }}
                >
                  Sign Up
                </Button>
              </Link>
            </Space>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
