/**
 * Guided Chat Page (Path 2)
 * 
 * AI-guided conversation flow with structured questions to collect
 * tax information step by step. Progress indicator shows completion status.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, Button, Progress, Radio, Checkbox, Input, InputNumber, Space, message, Spin } from 'antd';
import { ArrowRightOutlined, CheckCircleOutlined, HomeOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import type {
  GuidedQuestion,
  GuidedAnswerRequest,
  QuestionPhase,
} from '@/types/session';

const { TextArea } = Input;

export default function GuidedChatPage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<GuidedQuestion | null>(null);
  const [answer, setAnswer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const initializingRef = useRef(false);

  // Initialize guided chat session (only once, even in Strict Mode)
  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initializingRef.current) {
      console.log('[GuidedChat] Already initializing, skipping duplicate call');
      return;
    }
    
    console.log('[GuidedChat] Component mounted, initializing session');
    initializingRef.current = true;
    initializeSession();
    
    // Cleanup: Don't leave stray sessions when user navigates away
    return () => {
      console.log('[GuidedChat] Component unmounting');
      // Session will be cleaned up by backend or user can explicitly delete it
    };
  }, []);

  const initializeSession = async () => {
    console.log('[GuidedChat] initializeSession called');
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      // Create new session for guided chat
      console.log('[GuidedChat] Creating new session...');
      const sessionResponse = await fetch('http://localhost:8000/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create session');
      }

      const session = await sessionResponse.json();
      console.log('[GuidedChat] Session created:', session.session_id);
      setSessionId(session.session_id);

      // Get first question
      await getNextQuestion(session.session_id, null);
    } catch (error) {
      console.error('[GuidedChat] Initialize session error:', error);
      message.error('Failed to start guided chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getNextQuestion = async (sid: string, phase: QuestionPhase | null) => {
    try {
      const token = localStorage.getItem('access_token');
      const url = phase
        ? `http://localhost:8000/api/guided-chat/${sid}/next?current_phase=${phase}`
        : `http://localhost:8000/api/guided-chat/${sid}/initial`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get question');
      }

      const question = await response.json();
      setCurrentQuestion(question);
      setAnswer(null);
    } catch (error) {
      console.error('Get question error:', error);
      message.error('Failed to load next question');
    }
  };

  const submitAnswer = async () => {
    if (!sessionId || !currentQuestion || answer === null || answer === undefined) {
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const request: GuidedAnswerRequest = {
        answer,
        phase: currentQuestion.phase,
      };

      const response = await fetch(`http://localhost:8000/api/guided-chat/${sessionId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      // Check if conversation is complete
      if (currentQuestion.phase === 'complete') {
        await generateChecklist();
      } else {
        await getNextQuestion(sessionId, currentQuestion.phase);
      }
    } catch (error) {
      console.error('Submit answer error:', error);
      message.error('Failed to submit answer');
    } finally {
      setLoading(false);
    }
  };

  const generateChecklist = async () => {
    if (!sessionId) return;

    setGenerating(true);
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('http://localhost:8000/api/checklist/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          generation_mode: 'guided_chat',
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate checklist');
      }

      const checklist = await response.json();
      message.success('Checklist generated successfully!');
      router.push(`/checklist/${checklist.id}`);
    } catch (error) {
      console.error('Generate checklist error:', error);
      message.error('Failed to generate checklist');
    } finally {
      setGenerating(false);
    }
  };

  const renderAnswerInput = () => {
    if (!currentQuestion) return null;

    const { question_type, options } = currentQuestion;

    switch (question_type) {
      case 'single_choice':
        return (
          <Radio.Group value={answer} onChange={(e) => setAnswer(e.target.value)}>
            <Space direction="vertical" className="w-full">
              {options?.map((option) => (
                <Radio key={option.value} value={option.value} className="text-base">
                  {option.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );

      case 'multiple_choice':
        return (
          <Checkbox.Group
            value={answer || []}
            onChange={(values) => setAnswer(values)}
          >
            <Space direction="vertical" className="w-full">
              {options?.map((option) => (
                <Checkbox key={option.value} value={option.value} className="text-base">
                  {option.label}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        );

      case 'boolean':
        return (
          <Radio.Group value={answer} onChange={(e) => setAnswer(e.target.value)}>
            <Space direction="vertical">
              <Radio value={true} className="text-base">Yes</Radio>
              <Radio value={false} className="text-base">No</Radio>
            </Space>
          </Radio.Group>
        );

      case 'number':
        return (
          <InputNumber
            value={answer}
            onChange={(value) => setAnswer(value)}
            min={0}
            size="large"
            className="w-full"
            placeholder="Enter a number"
          />
        );

      case 'text':
        return (
          <TextArea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter your answer..."
            autoSize={{ minRows: 3, maxRows: 6 }}
            size="large"
          />
        );

      default:
        return null;
    }
  };

  if (loading && !currentQuestion) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spin size="large" tip="Loading guided chat..." />
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Failed to load guided chat</p>
          <Button onClick={() => router.push('/checklist')} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isComplete = currentQuestion.phase === 'complete';
  const canProceed = answer !== null && answer !== undefined && answer !== '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🧭 Guided Tax Checklist Creation
          </h1>
          <p className="text-gray-600">
            Answer a few questions to generate your personalized tax checklist
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Progress</span>
            <span className="text-sm font-medium text-blue-600">
              Question {currentQuestion.current_question} of {currentQuestion.total_questions}
            </span>
          </div>
          <Progress
            percent={currentQuestion.progress}
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
            showInfo={false}
          />
        </Card>

        {/* Question Card */}
        <Card className="shadow-xl mb-6" bodyStyle={{ padding: '32px' }}>
          {isComplete ? (
            <div className="text-center py-8">
              <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                All Questions Complete!
              </h2>
              <p className="text-gray-600 mb-6">
                We've collected all the information needed to generate your personalized tax checklist.
              </p>
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={generateChecklist}
                loading={generating}
                className="px-8"
              >
                Generate My Checklist
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  {currentQuestion.question}
                </h2>
                {currentQuestion.required && (
                  <span className="text-red-500 text-sm">* Required</span>
                )}
              </div>

              <div className="mb-8">
                {renderAnswerInput()}
              </div>

              <div className="flex justify-between items-center">
                <Button
                  icon={<HomeOutlined />}
                  onClick={() => router.push('/checklist')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<ArrowRightOutlined />}
                  onClick={submitAnswer}
                  loading={loading}
                  disabled={!canProceed}
                  className="px-8"
                >
                  {currentQuestion.current_question === currentQuestion.total_questions - 1
                    ? 'Finish'
                    : 'Next Question'}
                </Button>
              </div>
            </>
          )}
        </Card>

        {/* Helper Text */}
        <div className="text-center text-sm text-gray-500">
          <p>You can always update your information later in the checklist</p>
        </div>
      </div>
    </div>
  );
}
