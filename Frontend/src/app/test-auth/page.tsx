'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { Card, Typography, Space, Button, Tag, Alert, Descriptions } from 'antd'
import { isTokenExpired, getTokenExpiryDate, clearAuthTokens } from '@/lib/tokenUtils'

const { Title, Text, Paragraph } = Typography

export default function TestAuthPage() {
  const router = useRouter()
  const { user, isAuthenticated, token, logout } = useAuthStore()
  const [localStorageToken, setLocalStorageToken] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [tokenExpired, setTokenExpired] = useState<boolean>(false)
  const [tokenExpiryDate, setTokenExpiryDate] = useState<Date | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('access_token')
      setLocalStorageToken(storedToken)
      
      // Check token expiry
      const finalToken = token || storedToken
      if (finalToken) {
        setTokenExpired(isTokenExpired(finalToken))
        setTokenExpiryDate(getTokenExpiryDate(finalToken))
      }
    }
  }, [token])

  const handleReLogin = () => {
    clearAuthTokens()
    logout()
    router.push('/login')
  }

  const testAPI = async () => {
    const finalToken = token || localStorageToken
    if (!finalToken) {
      setTestResult({ error: 'No token available' })
      return
    }

    // Check if token is expired before making request
    if (isTokenExpired(finalToken)) {
      setTestResult({ 
        success: false, 
        status: 401,
        error: { detail: 'Token已过期，请重新登录' }
      })
      return
    }

    try {
      const response = await fetch('http://localhost:8000/api/checklist/my-checklists', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalToken}`,
        },
        credentials: 'include',
      })

      console.log('Response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        setTestResult({ success: true, data })
      } else {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
        setTestResult({ success: false, status: response.status, error })
      }
    } catch (err) {
      setTestResult({ success: false, error: err instanceof Error ? err.message : 'Unknown error' })
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>Authentication Test Page</Title>

      {tokenExpired && (
        <Alert
          message="Token已过期"
          description={
            <div>
              <p>您的登录令牌已于 <strong>{tokenExpiryDate?.toLocaleString('zh-CN')}</strong> 过期</p>
              <p>请重新登录以获取新的令牌</p>
            </div>
          }
          type="warning"
          showIcon
          action={
            <Button size="small" danger onClick={handleReLogin}>
              重新登录
            </Button>
          }
          style={{ marginBottom: 24 }}
        />
      )}

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="Auth Store State">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Is Authenticated">
              <Tag color={isAuthenticated ? 'green' : 'red'}>
                {isAuthenticated ? 'Yes' : 'No'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="User">
              <Text>{user ? `${user.email} (ID: ${user.id})` : 'None'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Token">
              {token ? (
                <Space direction="vertical" size={4}>
                  <Text code>{token.substring(0, 50)}...</Text>
                  {tokenExpiryDate && (
                    <Text type="secondary">
                      过期时间: {tokenExpiryDate.toLocaleString('zh-CN')}
                      {tokenExpired && <Tag color="red" style={{ marginLeft: 8 }}>已过期</Tag>}
                    </Text>
                  )}
                </Space>
              ) : (
                <Text type="secondary">None</Text>
              )}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="LocalStorage State">
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Token">
              <Text code>{localStorageToken ? `${localStorageToken.substring(0, 50)}...` : 'None'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Length">
              <Text>{localStorageToken?.length || 0} characters</Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="API Test">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button type="primary" onClick={testAPI}>
              Test GET /api/checklist/my-checklists
            </Button>

            {testResult && (
              <Card
                type="inner"
                title={testResult.success ? '✅ Success' : '❌ Failed'}
                style={{
                  backgroundColor: testResult.success ? '#f6ffed' : '#fff2f0',
                }}
              >
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </Card>
            )}
          </Space>
        </Card>

        <Card title="Debug Info">
          <Paragraph>
            <Text strong>Using Token: </Text>
            <Text code>{token || localStorageToken ? 'Available' : 'Missing'}</Text>
          </Paragraph>
          <Paragraph>
            <Text strong>Authorization Header: </Text>
            <Text code>
              {token || localStorageToken
                ? `Bearer ${(token || localStorageToken)?.substring(0, 30)}...`
                : 'Not set'}
            </Text>
          </Paragraph>
        </Card>
      </Space>
    </div>
  )
}
