/**
 * Login Page
 * User authentication page with email/password and Google OAuth
 */

'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, Divider, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailLogin = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      // OAuth2PasswordRequestForm expects form data, not JSON
      const formData = new URLSearchParams();
      formData.append('username', values.email);
      formData.append('password', values.password);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        // Try to surface backend error details (e.g., OAuth-only account message)
        let serverMsg = 'Login failed';
        try {
          const errBody = await response.json();
          if (errBody?.detail) serverMsg = errBody.detail;
        } catch {}
        throw new Error(serverMsg);
      }

      const data = await response.json();
      
      // Store tokens
      localStorage.setItem('access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      // Redirect immediately to home page
      window.location.href = '/';
    } catch (error: any) {
      console.error('Login error:', error);
      message.error(error?.message || 'Invalid email or password');
      setLoading(false);
    }
  };

  const handleGoogleError = (error: Error) => {
    console.error('Google login error:', error);
    message.error('Google login failed. Please try again.');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          borderRadius: 16,
          border: 'none',
        }}
        bodyStyle={{ padding: '48px 40px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Title level={2} style={{ marginBottom: 8, fontWeight: 700 }}>
            Welcome Back
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Sign in to continue to ChatTax
          </Text>
        </div>

        {/* Google Login Button */}
        <div style={{ marginBottom: 24 }}>
          <GoogleLoginButton
            onError={handleGoogleError}
          />
        </div>

        <Divider style={{ margin: '32px 0', fontSize: 13, color: '#999' }}>
          or continue with email
        </Divider>

        {/* Email/Password Login Form */}
        <Form
          form={form}
          name="login"
          onFinish={handleEmailLogin}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="your.email@example.com"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter your password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Enter your password"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <Link href="/forgot-password">
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                  Forgot password?
                </Text>
              </Link>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={loading}
              block
              style={{
                height: 48,
                fontSize: 16,
                fontWeight: 600,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Don't have an account?{' '}
            <Link href="/register">
              <Text style={{ color: '#667eea', fontWeight: 600 }}>
                Sign Up
              </Text>
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
