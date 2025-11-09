/**
 * Register Page
 * User registration page with email/password
 */

'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, Divider, message, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleLoginButton } from '@/components/auth/GoogleLoginButton';

const { Title, Text } = Typography;

interface RegisterFormValues {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: values.username,
          email: values.email,
          password: values.password,
          full_name: values.username,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      message.success('Registration successful! Please login.');
      router.push('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      message.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error: Error) => {
    console.error('Google registration error:', error);
    message.error('Google registration failed. Please try again.');
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
            Create Account
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Sign up to get started with ChatTax
          </Text>
        </div>

        {/* Google Sign Up Button */}
        <div style={{ marginBottom: 24 }}>
          <GoogleLoginButton
            onError={handleGoogleError}
          />
        </div>

        <Divider style={{ margin: '32px 0', fontSize: 13, color: '#999' }}>
          or register with email
        </Divider>

        {/* Registration Form */}
        <Form
          form={form}
          name="register"
          onFinish={handleRegister}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: 'Please enter a username' },
              { min: 3, message: 'Username must be at least 3 characters' },
              { max: 50, message: 'Username must not exceed 50 characters' },
              { 
                pattern: /^[a-zA-Z0-9_]+$/, 
                message: 'Username can only contain letters, numbers, and underscores' 
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Choose a username (3-50 characters)"
              size="large"
              maxLength={50}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
              { max: 100, message: 'Email must not exceed 100 characters' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="your.email@example.com"
              size="large"
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter a password' },
              { min: 8, message: 'Password must be at least 8 characters' },
              { max: 100, message: 'Password must not exceed 100 characters' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)|(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])|(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
                message: 'Password must contain at least: letters and numbers, or include special characters',
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Create a strong password (8-100 characters)"
              size="large"
              maxLength={100}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm Password"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm your password"
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
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
              Create Account
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Already have an account?{' '}
            <Link href="/login">
              <Text style={{ color: '#667eea', fontWeight: 600 }}>
                Sign In
              </Text>
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
