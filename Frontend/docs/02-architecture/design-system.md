# Design System

ChatTax Frontend design system with Ant Design and Tailwind CSS integration.

## Design Principles

1. **Consistency**: Unified component behavior and styling
2. **Accessibility**: WCAG 2.1 AA compliance
3. **Responsiveness**: Mobile-first design approach
4. **Performance**: Optimized component loading

---

## Ant Design Integration

### Theme Configuration

```typescript
// app/layout.tsx or theme provider
import { ConfigProvider } from 'antd';

const theme = {
  token: {
    colorPrimary: '#0ea5e9',    // Primary blue
    colorSuccess: '#10b981',     // Success green
    colorWarning: '#f59e0b',     // Warning amber
    colorError: '#ef4444',       // Error red
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'Inter, system-ui, sans-serif',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={theme}>
      {children}
    </ConfigProvider>
  );
}
```

### Common Components

**Buttons**
```typescript
import { Button } from 'antd';

<Button type="primary">Primary</Button>
<Button type="default">Default</Button>
<Button type="link">Link</Button>
<Button loading>Loading</Button>
<Button danger>Danger</Button>
```

**Form Elements**
```typescript
import { Input, Form, Select } from 'antd';

<Form layout="vertical">
  <Form.Item label="Email" name="email">
    <Input placeholder="Enter email" />
  </Form.Item>
  
  <Form.Item label="Country" name="country">
    <Select>
      <Select.Option value="AU">Australia</Select.Option>
    </Select>
  </Form.Item>
</Form>
```

**Cards & Layout**
```typescript
import { Card, Space, Divider } from 'antd';

<Card title="Tax Information">
  <Space direction="vertical">
    <p>Content here</p>
    <Divider />
    <Button>Action</Button>
  </Space>
</Card>
```

---

## Tailwind CSS Integration

### Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0ea5e9',
        secondary: '#64748b',
      },
    },
  },
  // Important for Ant Design compatibility
  corePlugins: {
    preflight: false,
  },
};
```

### Utility Classes

```typescript
// Layout
<div className="flex flex-col items-center justify-center min-h-screen">
  <div className="container mx-auto px-4 py-8">
    <h1 className="text-4xl font-bold mb-4">Title</h1>
  </div>
</div>

// Responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>

// Spacing
<div className="p-4 mb-8 mt-2">Content</div>
```

---

## Typography

### Headings
```typescript
<h1 className="text-4xl font-bold">Main Heading</h1>
<h2 className="text-3xl font-semibold">Section Heading</h2>
<h3 className="text-2xl font-medium">Subsection</h3>
```

### Text Styles
```typescript
<p className="text-base text-gray-700">Body text</p>
<p className="text-sm text-gray-500">Small text</p>
<span className="font-bold text-primary">Emphasized</span>
```

---

## Color Palette

### Primary Colors
- Primary: `#0ea5e9` (blue)
- Secondary: `#64748b` (gray)
- Success: `#10b981` (green)
- Warning: `#f59e0b` (amber)
- Error: `#ef4444` (red)

### Gray Scale
- `#f8fafc` (50) → `#020617` (950)

---

## Responsive Breakpoints

```typescript
// Tailwind breakpoints
sm: 640px   // Mobile
md: 768px   // Tablet
lg: 1024px  // Desktop
xl: 1280px  // Large desktop
2xl: 1536px // Extra large
```

**Usage**:
```typescript
<div className="w-full md:w-1/2 lg:w-1/3">
  Responsive width
</div>
```

---

## Component Patterns

### Layout Pattern
```typescript
<div className="min-h-screen flex flex-col">
  <header>Navbar</header>
  <main className="flex-1">Content</main>
  <footer>Footer</footer>
</div>
```

### Card Pattern
```typescript
<Card 
  title="Title"
  extra={<Button>Action</Button>}
  className="shadow-lg"
>
  Card content
</Card>
```

### Form Pattern
```typescript
<Form
  layout="vertical"
  onFinish={handleSubmit}
  className="max-w-md mx-auto"
>
  <Form.Item label="Field" name="field" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
  
  <Form.Item>
    <Button type="primary" htmlType="submit">
      Submit
    </Button>
  </Form.Item>
</Form>
```

---

## Icons

```typescript
import { 
  UserOutlined, 
  CheckCircleOutlined,
  MessageOutlined 
} from '@ant-design/icons';

<Button icon={<UserOutlined />}>Profile</Button>
<CheckCircleOutlined className="text-green-500" />
```

---

## For GitHub Copilot

**Design System**: ChatTax uses Ant Design 5 for components with Tailwind CSS for utilities. Theme configured via ConfigProvider. Primary color #0ea5e9 (blue). Mobile-first responsive design. Tailwind preflight disabled for Ant Design compatibility.

**Key Components**: Button, Input, Form, Card, Space, Divider, Select, Modal, Table, Notification.

**Layout Pattern**: Flex containers with min-h-screen, flex-1 for main content, container mx-auto for centering.

---

**Next**: [Components Overview](../04-components/overview.md) | [System Overview](./overview.md)
