/**
 * SmartGenerateButton Component
 * 
 * Intelligent button that appears when enough tax information has been
 * collected from the conversation. Shows completion percentage and
 * generates checklist using the free_chat mode.
 */

'use client';

import React, { useState } from 'react';
import { Button, Progress, Tooltip, message } from 'antd';
import { CheckCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useSessionContext } from '@/contexts/SessionContext';
import { GenerationMode } from '@/types/session';

interface SmartGenerateButtonProps {
  /** Whether to show the button inline or as a floating action */
  variant?: 'inline' | 'floating';
  /** Custom CSS class */
  className?: string;
}

/**
 * Smart Generate Checklist Button
 * 
 * Dynamically appears when conversation contains sufficient tax information
 * (completion >= 60%). Shows progress indicator and triggers checklist
 * generation from conversation context.
 * 
 * @example
 * ```tsx
 * // In chat page
 * <SmartGenerateButton variant="floating" />
 * 
 * // In message area
 * <SmartGenerateButton variant="inline" />
 * ```
 */
export default function SmartGenerateButton({
  variant = 'inline',
  className = '',
}: SmartGenerateButtonProps) {
  const router = useRouter();
  const {
    session,
    completionPercentage,
    canGenerateChecklist,
    missingFields,
    linkChecklist,
  } = useSessionContext();
  const [generating, setGenerating] = useState(false);

  // Don't show button if no session or insufficient info
  if (!session || !canGenerateChecklist) {
    return null;
  }

  const handleGenerate = async () => {
    if (!session) {
      message.error('No active session');
      return;
    }

    setGenerating(true);

    try {
      // Call checklist generation API with free_chat mode
      const response = await fetch('http://localhost:8000/api/checklist/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          generation_mode: GenerationMode.FREE_CHAT,
          session_id: session.session_id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate checklist');
      }

      const checklist = await response.json();

      // Link checklist to session
      await linkChecklist(checklist.id);

      message.success('Checklist generated successfully!');
      
      // Navigate to checklist detail page
      router.push(`/checklist/${checklist.id}`);
    } catch (error) {
      console.error('Generate checklist error:', error);
      message.error('Failed to generate checklist. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getProgressColor = () => {
    if (completionPercentage >= 80) return '#52c41a'; // green
    if (completionPercentage >= 60) return '#1890ff'; // blue
    return '#faad14'; // orange
  };

  const tooltipContent = (
    <div className="space-y-2">
      <div className="font-semibold">Tax Information Collected</div>
      <Progress
        percent={completionPercentage}
        size="small"
        strokeColor={getProgressColor()}
        showInfo={false}
      />
      <div className="text-xs">
        {missingFields.length > 0 ? (
          <>
            <div>Missing optional fields:</div>
            <ul className="list-disc list-inside mt-1 space-y-1">
              {missingFields.slice(0, 3).map((field) => (
                <li key={field}>{field.replace(/_/g, ' ')}</li>
              ))}
              {missingFields.length > 3 && (
                <li>...and {missingFields.length - 3} more</li>
              )}
            </ul>
          </>
        ) : (
          <div className="text-green-400">
            ✓ All required information collected!
          </div>
        )}
      </div>
      <div className="pt-2 border-t border-gray-600 text-xs opacity-75">
        Click to generate your personalized tax checklist
      </div>
    </div>
  );

  if (variant === 'floating') {
    return (
      <Tooltip title={tooltipContent} placement="left">
        <div
          className={`fixed bottom-24 right-8 z-50 ${className}`}
          style={{
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          }}
        >
          <Button
            type="primary"
            size="large"
            shape="round"
            icon={<RocketOutlined />}
            onClick={handleGenerate}
            loading={generating}
            className="shadow-2xl hover:shadow-3xl transition-all duration-300"
            style={{
              height: '56px',
              padding: '0 32px',
              fontSize: '16px',
              background: `linear-gradient(135deg, ${getProgressColor()} 0%, #1890ff 100%)`,
              border: 'none',
            }}
          >
            <div className="flex items-center gap-2">
              <span>Generate Checklist</span>
              <div className="flex items-center gap-1 px-2 py-1 bg-white bg-opacity-20 rounded-full">
                <CheckCircleOutlined />
                <span className="font-bold">{completionPercentage}%</span>
              </div>
            </div>
          </Button>
        </div>
      </Tooltip>
    );
  }

  // Inline variant
  return (
    <Tooltip title={tooltipContent} placement="top">
      <Button
        type="primary"
        size="large"
        icon={<RocketOutlined />}
        onClick={handleGenerate}
        loading={generating}
        className={`shadow-lg hover:shadow-xl transition-all duration-300 ${className}`}
        style={{
          background: `linear-gradient(135deg, ${getProgressColor()} 0%, #1890ff 100%)`,
          border: 'none',
        }}
      >
        <div className="flex items-center gap-2">
          <span>Generate Checklist</span>
          <div className="flex items-center gap-1 px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs">
            <CheckCircleOutlined />
            <span className="font-bold">{completionPercentage}%</span>
          </div>
        </div>
      </Button>
    </Tooltip>
  );
}
