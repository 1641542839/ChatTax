/**
 * TaxInfoCollectionWidget Component
 * 
 * Displays tax information collection progress and checklist generation button
 * Shows real-time progress as user provides information during chat
 */

'use client';

import { Card, Progress, Space, Typography, Tag, message } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useSessionContext } from '@/contexts/SessionContext';
import { SmartGenerateButton } from '@/components/checklist/SmartGenerateButton';

const { Text } = Typography;

export default function TaxInfoCollectionWidget() {
  const router = useRouter();
  const {
    session,
    completionPercentage,
    extractedIdentity,
    canGenerateChecklist,
    hasChecklist,
    checklistId,
    loading,
    generateChecklist,
    regenerateChecklist,
  } = useSessionContext();

  // Debug: Log when component re-renders with new data
  console.log('[TaxInfoCollectionWidget] Render - completionPercentage:', completionPercentage);
  console.log('[TaxInfoCollectionWidget] Render - session:', session?.session_id);
  console.log('[TaxInfoCollectionWidget] Render - extractedIdentity:', extractedIdentity);

  /**
   * Handle checklist generation with navigation
   * Follows Single Responsibility: Widget coordinates between generation and navigation
   */
  const handleGenerate = async () => {
    // If checklist already exists, just view it
    if (hasChecklist && checklistId) {
      router.push(`/checklist?id=${checklistId}`);
      return;
    }

    // Otherwise generate new checklist
    try {
      const checklist = await generateChecklist();
      if (checklist && checklist.id) {
        message.success('Checklist generated successfully!');
        // Navigate to checklist detail page
        router.push(`/checklist?id=${checklist.id}`);
      }
    } catch (error) {
      console.error('[TaxInfoCollectionWidget] Generate error:', error);
      message.error('Failed to generate checklist');
    }
  };

  /**
   * Handle checklist regeneration with navigation
   */
  const handleRegenerate = async () => {
    try {
      const checklist = await regenerateChecklist();
      if (checklist && checklist.id) {
        message.success('Checklist regenerated successfully!');
        router.push(`/checklist?id=${checklist.id}`);
      }
    } catch (error) {
      console.error('[TaxInfoCollectionWidget] Regenerate error:', error);
      message.error('Failed to regenerate checklist');
    }
  };

  /**
   * View existing checklist
   */
  const handleViewChecklist = () => {
    if (checklistId) {
      router.push(`/checklist?id=${checklistId}`);
    }
  };

  // Only show when there's an active session
  if (!session) {
    return (
      <Card
        size="small"
        className="shadow-sm"
        style={{ borderRadius: 8 }}
      >
        <Space direction="vertical" size="small" style={{ width: '100%' }} className="text-center">
          <InfoCircleOutlined className="text-gray-400 text-2xl" />
          <Text type="secondary" style={{ fontSize: 12 }}>
            开始对话以收集税务信息
          </Text>
        </Space>
      </Card>
    );
  }

  // Determine progress status color
  const getProgressStatus = () => {
    if (completionPercentage >= 60) return 'success';
    if (completionPercentage >= 40) return 'normal';
    return 'exception';
  };

  return (
    <Card
      size="small"
      className="shadow-sm hover:shadow-md transition-shadow"
      style={{ borderRadius: 8 }}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Header */}
        <Space>
          <InfoCircleOutlined className="text-blue-500 text-lg" />
          <Text strong>税务信息收集</Text>
        </Space>

        {/* Progress Circle */}
        <div className="flex items-center gap-3">
          <Progress
            type="circle"
            percent={completionPercentage}
            width={60}
            status={getProgressStatus()}
            strokeColor={{
              '0%': '#ff4d4f',
              '50%': '#faad14',
              '100%': '#52c41a',
            }}
          />
          <Space direction="vertical" size={0}>
            <Text>
              信息完整度: <strong>{completionPercentage}%</strong>
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {completionPercentage >= 60 
                ? '✅ 可以生成 Checklist' 
                : `还需 ${60 - completionPercentage}% 信息`
              }
            </Text>
          </Space>
        </div>

        {/* Extracted Info Tags */}
        {extractedIdentity && (
          <div className="flex flex-wrap gap-2">
            {extractedIdentity.filing_status && (
              <Tag color="blue" style={{ fontSize: 11 }}>
                📊 {extractedIdentity.filing_status}
              </Tag>
            )}
            {extractedIdentity.has_dependents && (
              <Tag color="green" style={{ fontSize: 11 }}>
                👶 有抚养人
              </Tag>
            )}
            {extractedIdentity.has_investments && (
              <Tag color="purple" style={{ fontSize: 11 }}>
                💰 有投资
              </Tag>
            )}
            {extractedIdentity.has_rental_property && (
              <Tag color="orange" style={{ fontSize: 11 }}>
                🏠 有租金收入
              </Tag>
            )}
          </div>
        )}

        {/* Generate Button */}
        <SmartGenerateButton
          completionPercentage={completionPercentage}
          canGenerate={canGenerateChecklist}
          hasChecklist={hasChecklist}
          loading={loading}
          onGenerate={handleGenerate}
          onRegenerate={handleRegenerate}
          size="small"
        />
      </Space>
    </Card>
  );
}
