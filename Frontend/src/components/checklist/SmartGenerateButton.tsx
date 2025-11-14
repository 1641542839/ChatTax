/**
 * SmartGenerateButton Component
 * 
 * Intelligent checklist generation button that:
 * - Shows progress towards information completion (60% threshold)
 * - Enables generation only when sufficient information is collected
 * - Displays regenerate option when checklist already exists
 * - Provides visual feedback on completion percentage
 */

import React from 'react';
import { Button, Progress, Tooltip, Space } from 'antd';
import { CheckCircleOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';

interface SmartGenerateButtonProps {
  /** Information completion percentage (0-100) */
  completionPercentage: number;
  /** Whether session has sufficient info for generation (>= 60%) */
  canGenerate: boolean;
  /** Whether checklist already exists */
  hasChecklist: boolean;
  /** Loading state */
  loading?: boolean;
  /** Callback when generate is clicked */
  onGenerate: () => void;
  /** Callback when regenerate is clicked */
  onRegenerate?: () => void;
  /** Button size */
  size?: 'small' | 'middle' | 'large';
  /** Custom className */
  className?: string;
}

/**
 * Smart button for checklist generation with progress indication
 * 
 * @example
 * ```tsx
 * <SmartGenerateButton
 *   completionPercentage={75}
 *   canGenerate={true}
 *   hasChecklist={false}
 *   onGenerate={() => generateChecklist()}
 * />
 * ```
 */
export const SmartGenerateButton: React.FC<SmartGenerateButtonProps> = ({
  completionPercentage,
  canGenerate,
  hasChecklist,
  loading = false,
  onGenerate,
  onRegenerate,
  size = 'middle',
  className,
}) => {
  // Determine progress bar color based on completion
  const getProgressStatus = () => {
    if (completionPercentage >= 60) return 'success';
    if (completionPercentage >= 40) return 'normal';
    return 'exception';
  };

  // Generate tooltip text based on state
  const getTooltipText = () => {
    if (hasChecklist) {
      return 'Checklist已生成。点击重新生成以使用最新信息更新。';
    }
    if (canGenerate) {
      return `信息完整度: ${completionPercentage}%。已达到生成条件，点击生成Checklist。`;
    }
    const remaining = 60 - completionPercentage;
    return `需要更多信息 (还需${remaining}%)。继续对话以收集必要信息。`;
  };

  // If checklist exists, show view and regenerate buttons
  if (hasChecklist) {
    return (
      <Space direction="vertical" size="small" style={{ width: '100%' }} className={className}>
        <Tooltip title="查看已生成的Checklist">
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            size={size}
            onClick={onGenerate}
            style={{ width: '100%' }}
          >
            查看Checklist
          </Button>
        </Tooltip>
        {onRegenerate && (
          <Button
            type="default"
            icon={<ReloadOutlined />}
            onClick={onRegenerate}
            loading={loading}
            size={size}
            style={{ width: '100%' }}
          >
            重新生成
          </Button>
        )}
      </Space>
    );
  }

  // Main generate button with progress
  return (
    <Space direction="vertical" size="small" style={{ width: '100%' }} className={className}>
      <Tooltip title={getTooltipText()}>
        <Button
          type="primary"
          icon={canGenerate ? <CheckCircleOutlined /> : <InfoCircleOutlined />}
          onClick={onGenerate}
          disabled={!canGenerate}
          loading={loading}
          size={size}
          style={{ width: '100%' }}
        >
          {canGenerate ? '生成Checklist' : `收集信息中 (${completionPercentage}%)`}
        </Button>
      </Tooltip>
      
      <div style={{ padding: '0 8px' }}>
        <Progress
          percent={completionPercentage}
          size="small"
          status={getProgressStatus()}
          showInfo={true}
          format={(percent) => `${percent}%`}
        />
        {!canGenerate && (
          <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
            需要至少60%的信息完整度
          </div>
        )}
      </div>
    </Space>
  );
};

export default SmartGenerateButton;
