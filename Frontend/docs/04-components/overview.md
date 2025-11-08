# Component Overview

React component architecture and organization for ChatTax Frontend.

## Component Categories

### 1. Layout Components (`components/layout/`)
- **Navbar**: Top navigation bar with logo and user menu
- **Sidebar**: Optional side navigation
- **Footer**: Page footer with links and copyright

### 2. Chat Components (`components/chat/`)
- **ChatInterface**: Main chat container
- **MessageBubble**: Individual message display
- **ChatInput**: Message input with send button
- **SourceCitation**: Display document sources
- **ChecklistWidget**: Embedded checklist progress

### 3. Checklist Components (`components/checklist/`)
- **ChecklistForm**: Identity information form
- **ChecklistDisplay**: Full checklist view
- **TaskCard**: Individual task item
- **ProgressBar**: Completion progress indicator
- **IdentityForm**: User identity input form

### 4. UI Components (`components/ui/`)
- **Button**: Custom button variants
- **Card**: Content card wrapper
- **Loading**: Loading states and spinners
- **ErrorBoundary**: Error handling component

---

## Component Structure

### Functional Component Pattern

```typescript
'use client'; // If using client-side features

import { useState } from 'react';
import type { ComponentProps } from '@/types/components';

interface Props {
  title: string;
  onAction?: () => void;
}

export default function MyComponent({ title, onAction }: Props) {
  const [state, setState] = useState('');

  return (
    <div className="my-component">
      <h2>{title}</h2>
      <button onClick={onAction}>Action</button>
    </div>
  );
}
```

### Component with API Integration

```typescript
'use client';

import { useEffect, useState } from 'react';
import { queryTax } from '@/services/chat';
import type { QueryResponse } from '@/types/api';

export default function TaxQuery() {
  const [answer, setAnswer] = useState<QueryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleQuery = async (question: string) => {
    setLoading(true);
    try {
      const response = await queryTax({ question });
      setAnswer(response);
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading && <p>Loading...</p>}
      {answer && <p>{answer.answer}</p>}
    </div>
  );
}
```

---

## Common Patterns

### 1. Chat Message Component

```typescript
interface MessageProps {
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export function MessageBubble({ content, sender, timestamp }: MessageProps) {
  return (
    <div className={`message ${sender === 'user' ? 'message-user' : 'message-ai'}`}>
      <p>{content}</p>
      <span className="text-xs text-gray-500">
        {timestamp.toLocaleTimeString()}
      </span>
    </div>
  );
}
```

### 2. Task Card Component

```typescript
interface TaskProps {
  task: ChecklistItem;
  onToggle: (id: string) => void;
}

export function TaskCard({ task, onToggle }: TaskProps) {
  return (
    <Card className="task-card">
      <Checkbox 
        checked={task.completed}
        onChange={() => onToggle(task.id)}
      >
        {task.title}
      </Checkbox>
      <p className="text-sm text-gray-600">{task.description}</p>
      <Tag color={task.priority === 'high' ? 'red' : 'blue'}>
        {task.priority}
      </Tag>
    </Card>
  );
}
```

### 3. Form Component

```typescript
export function IdentityForm({ onSubmit }: { onSubmit: (data: IdentityInfo) => void }) {
  const [form] = Form.useForm();

  const handleSubmit = (values: IdentityInfo) => {
    onSubmit(values);
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Form.Item 
        label="Employment Status" 
        name="employment_status"
        rules={[{ required: true }]}
      >
        <Select>
          <Select.Option value="employed">Employed</Select.Option>
          <Select.Option value="self_employed">Self-Employed</Select.Option>
        </Select>
      </Form.Item>
      
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Generate Checklist
        </Button>
      </Form.Item>
    </Form>
  );
}
```

---

## Component Best Practices

1. **Use TypeScript**: Define prop types with interfaces
2. **Client vs Server**: Use `'use client'` only when needed
3. **Composition**: Build complex UIs from simple components
4. **Props Drilling**: Use Zustand for deep state
5. **Error Handling**: Wrap async operations in try-catch
6. **Loading States**: Always show loading indicators
7. **Accessibility**: Use semantic HTML and ARIA labels

---

## For GitHub Copilot

**Component Architecture**: ChatTax components organized by feature (layout, chat, checklist, ui). Functional components with TypeScript. Client components use `'use client'`. Props typed with interfaces. State management with Zustand for global, useState for local.

**Key Patterns**: Message bubbles for chat, task cards for checklists, forms with Ant Design, API integration in components or services.

**File Locations**:
- Layout: `src/components/layout/`
- Chat: `src/components/chat/`
- Checklist: `src/components/checklist/`
- UI: `src/components/ui/`

---

**See also**: [Chat Components](./chat.md) | [Checklist Components](./checklist.md) | [Layout Components](./layout.md)
