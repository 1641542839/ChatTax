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
  const [sessionId] = useState<string>(`guided-${Date.now()}`); // Temporary session ID
  const [currentQuestion, setCurrentQuestion] = useState<GuidedQuestion | null>(null);
  const [answer, setAnswer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const initializingRef = useRef(false);

  // Initialize guided chat (only once, even in Strict Mode)
  useEffect(() => {
    // Prevent double initialization in React Strict Mode
    if (initializingRef.current) {
      console.log('[GuidedChat] Already initializing, skipping duplicate call');
      return;
    }
    
    console.log('[GuidedChat] Component mounted, loading first question');
    initializingRef.current = true;
    getNextQuestion(sessionId, null);
  }, [sessionId]);

  const getNextQuestion = async (sid: string, phase: QuestionPhase | null) => {
    setLoading(true);
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
      
      // If conversation is complete, automatically generate checklist
      if (question.phase === 'complete' || question.is_complete) {
        // Wait a moment to show the completion message
        setTimeout(() => {
          generateChecklist();
        }, 2000);
      }
    } catch (error) {
      console.error('Get question error:', error);
      message.error('Failed to load next question');
    } finally {
      setLoading(false);
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

      // Get next question (which will auto-generate checklist if complete)
      await getNextQuestion(sessionId, currentQuestion.phase);
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
      
      // For guided_chat mode, send generation_mode and session_id as query parameters
      // The backend will extract identity_info from the session
      const response = await fetch(
        `http://localhost:8000/api/checklist/generate?generation_mode=guided_chat&session_id=${sessionId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({}), // Empty body for guided_chat mode
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate checklist');
      }

      const checklist = await response.json();
      message.success('Checklist generated successfully!');
      router.push(`/checklist?id=${checklist.id}`);
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
          <Radio.Group value={answer} onChange={(e) => setAnswer(e.target.value)} className="w-full">
            <Space direction="vertical" className="w-full" size="middle">
              {options?.map((option) => (
                <div 
                  key={option.value} 
                  className={`p-5 rounded-2xl cursor-pointer transition-all transform hover:scale-102 ${
                    answer === option.value
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-xl'
                      : 'bg-white hover:bg-blue-50 shadow-md hover:shadow-lg'
                  }`}
                  onClick={() => setAnswer(option.value)}
                >
                  <Radio 
                    value={option.value}
                    className="w-full"
                    style={{ pointerEvents: 'none' }}
                  >
                    <span className={`text-lg font-semibold ml-2 ${
                      answer === option.value ? 'text-white' : 'text-gray-700'
                    }`}>
                      {option.label}
                    </span>
                  </Radio>
                </div>
              ))}
            </Space>
          </Radio.Group>
        );

      case 'multiple_choice':
        const selectedValues = Array.isArray(answer) ? answer : [];
        return (
          <Checkbox.Group
            value={selectedValues}
            onChange={(values) => setAnswer(values)}
            className="w-full"
          >
            <Space direction="vertical" className="w-full" size="middle">
              {options?.map((option) => (
                <div 
                  key={option.value}
                  className={`p-5 rounded-2xl cursor-pointer transition-all transform hover:scale-102 ${
                    selectedValues.includes(option.value)
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-xl'
                      : 'bg-white hover:bg-indigo-50 shadow-md hover:shadow-lg'
                  }`}
                  onClick={() => {
                    let newValues;
                    
                    // Handle "none" option logic
                    if (option.value === 'none') {
                      // If clicking "none", clear all other selections
                      newValues = selectedValues.includes('none') ? [] : ['none'];
                    } else {
                      // If clicking any other option, remove "none" if it exists
                      const filteredValues = selectedValues.filter(v => v !== 'none');
                      newValues = filteredValues.includes(option.value)
                        ? filteredValues.filter(v => v !== option.value)
                        : [...filteredValues, option.value];
                    }
                    
                    setAnswer(newValues);
                  }}
                >
                  <Checkbox 
                    value={option.value}
                    className="w-full"
                    style={{ pointerEvents: 'none' }}
                  >
                    <span className={`text-lg font-semibold ml-2 ${
                      selectedValues.includes(option.value) ? 'text-white' : 'text-gray-700'
                    }`}>
                      {option.label}
                    </span>
                  </Checkbox>
                </div>
              ))}
            </Space>
          </Checkbox.Group>
        );

      case 'boolean':
        return (
          <div className="flex gap-4 justify-center">
            <button
              type="button"
              onClick={() => setAnswer(true)}
              className={`flex-1 max-w-xs py-6 px-8 text-lg font-bold rounded-2xl border-3 transition-all transform hover:scale-105 ${
                answer === true
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-600 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-400 hover:bg-green-50'
              }`}
            >
              ✅ Yes
            </button>
            <button
              type="button"
              onClick={() => setAnswer(false)}
              className={`flex-1 max-w-xs py-6 px-8 text-lg font-bold rounded-2xl border-3 transition-all transform hover:scale-105 ${
                answer === false
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-600 shadow-lg'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-red-400 hover:bg-red-50'
              }`}
            >
              ❌ No
            </button>
          </div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">🧭</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
            Guided Tax Checklist
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Answer a few simple questions to generate your personalized Australian tax checklist
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8 shadow-xl border-0 rounded-2xl overflow-hidden" bodyStyle={{ padding: '24px' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Progress</span>
            <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              Question {currentQuestion.current_question} of {currentQuestion.total_questions}
            </span>
          </div>
          <Progress
            percent={currentQuestion.progress}
            strokeColor={{
              '0%': '#3b82f6',
              '50%': '#6366f1',
              '100%': '#8b5cf6',
            }}
            strokeWidth={12}
            showInfo={false}
            className="mb-2"
          />
          <div className="text-xs text-gray-500 text-center mt-2">
            {Math.round(currentQuestion.progress)}% Complete
          </div>
        </Card>

        {/* Question Card */}
        <Card className="shadow-2xl mb-8 border-0 rounded-2xl overflow-hidden" bodyStyle={{ padding: '0' }}>
          {isComplete ? (
            <div className="text-center py-16 px-8 bg-gradient-to-br from-green-50 to-emerald-50">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-6 shadow-lg">
                <CheckCircleOutlined className="text-4xl text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">
                All Questions Complete! 🎉
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                We've collected all the information needed to generate your personalized tax checklist.
              </p>
              <Button
                type="primary"
                size="large"
                icon={<ArrowRightOutlined />}
                onClick={generateChecklist}
                loading={generating}
                className="h-12 px-10 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' }}
              >
                Generate My Checklist
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                    {currentQuestion.current_question}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2 leading-relaxed">
                      {currentQuestion.question}
                    </h2>
                    {currentQuestion.required && (
                      <span className="inline-flex items-center text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md">
                        * Required
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="mb-8">
                  {renderAnswerInput()}
                </div>

                <div className="flex justify-between items-center gap-4">
                  <Button
                    icon={<HomeOutlined />}
                    onClick={() => router.push('/checklist')}
                    disabled={loading}
                    size="large"
                    className="h-12 px-6 rounded-xl border-2 hover:border-gray-400 transition-all"
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
                    className="h-12 px-10 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    style={{ background: canProceed ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)' : undefined }}
                  >
                    {currentQuestion.current_question === currentQuestion.total_questions
                      ? 'Finish'
                      : 'Next Question'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Helper Text */}
        <div className="text-center">
          <p className="text-sm text-gray-500 bg-white/60 backdrop-blur-sm inline-block px-4 py-2 rounded-full">
            💡 You can always update your information later in the checklist
          </p>
        </div>
      </div>
    </div>
  );
}
