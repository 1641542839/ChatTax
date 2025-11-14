/**
 * Session Management Types
 * 
 * TypeScript interfaces for multi-turn conversation sessions,
 * including identity extraction, intent classification, and generation modes.
 */

// ============================================================
// Session Types
// ============================================================

/**
 * Message in a conversation session
 */
export interface SessionMessage {
  /** Message role */
  role: 'user' | 'assistant';
  /** Message content */
  content: string;
  /** Message timestamp */
  timestamp: string;
}

/**
 * Tax identity information extracted from conversation
 */
export interface ExtractedIdentity {
  /** Filing status */
  filing_status?: 'single' | 'married_joint' | 'married_separate' | 'head_of_household' | 'qualifying_widow';
  /** Annual income range */
  income_range?: string;
  /** Has dependents */
  has_dependents?: boolean;
  /** Number of dependents */
  num_dependents?: number;
  /** State of residence */
  state?: string;
  /** Has self-employment income */
  has_self_employment?: boolean;
  /** Has investment income */
  has_investments?: boolean;
  /** Has rental property */
  has_rental_property?: boolean;
  /** Has education expenses */
  has_education_expenses?: boolean;
  /** Has medical expenses */
  has_medical_expenses?: boolean;
  /** Has charitable donations */
  has_charitable_donations?: boolean;
  /** Has retirement contributions */
  has_retirement_contributions?: boolean;
  /** Additional context */
  additional_context?: string;
  /** Completion percentage (0-100) */
  completion_percentage?: number;
  /** Missing required fields */
  missing_fields?: string[];
}

/**
 * Chat session
 */
export interface ChatSession {
  /** Session UUID */
  id: string;
  /** Session UUID (alias for id) */
  session_id: string;
  /** Associated user ID */
  user_id: string;
  /** Conversation history */
  conversation_history: SessionMessage[];
  /** Extracted identity information */
  extracted_identity: ExtractedIdentity | null;
  /** Information completion percentage (0-100) */
  completion_percentage?: number;
  /** Associated checklist ID */
  checklist_id: string | null;
  /** Whether checklist has been generated */
  checklist_generated?: boolean;
  /** Session creation time */
  created_at: string;
  /** Last update time */
  updated_at: string;
}

/**
 * Session list item (without full history)
 */
export interface SessionListItem {
  id: number;  // Database integer ID
  session_id: string;  // UUID string
  user_id: number;
  is_active: boolean;
  checklist_id: number | null;
  created_at: string;
  updated_at: string;
  /** Number of messages in history */
  message_count: number;
  /** Last message preview */
  last_message?: string;
  /** Session title */
  title?: string;
  /** Whether checklist has been generated */
  checklist_generated?: boolean;
  /** Information completion percentage (0-100) */
  completion_percentage?: number;
}

// ============================================================
// Request Types
// ============================================================

/**
 * Create session request
 */
export interface CreateSessionRequest {
  /** Optional initial message */
  initial_message?: string;
}

/**
 * Add message to session request
 */
export interface AddMessageRequest {
  /** User message content */
  content: string;
  /** Message role (default: user) */
  role?: 'user';
}

/**
 * Chat stream request with session support
 */
export interface ChatStreamRequest {
  /** User message */
  message: string;
  /** Optional session ID for multi-turn conversation */
  session_id?: string;
}

// ============================================================
// Intent Classification Types
// ============================================================

/**
 * User intent types in conversation
 */
export enum IntentType {
  /** User asking for explanation of a checklist item */
  EXPLAIN_ITEM = 'EXPLAIN_ITEM',
  /** User providing new information */
  NEW_INFO = 'NEW_INFO',
  /** User requesting checklist update/regeneration */
  UPDATE_REQUEST = 'UPDATE_REQUEST',
  /** General conversation */
  GENERAL = 'GENERAL',
}

/**
 * Intent classification result
 */
export interface IntentClassification {
  /** Classified intent type */
  intent: IntentType;
  /** Confidence score (0-1) */
  confidence: number;
  /** Should trigger checklist regeneration */
  should_regenerate: boolean;
  /** Explanation of classification */
  reasoning?: string;
}

// ============================================================
// Generation Mode Types
// ============================================================

/**
 * Checklist generation modes
 */
export enum GenerationMode {
  /** Path 1: Quick form-based generation */
  FORM = 'form',
  /** Path 2: Guided chat with structured questions */
  GUIDED_CHAT = 'guided_chat',
  /** Path 3: Free chat with smart extraction */
  FREE_CHAT = 'free_chat',
}

/**
 * Checklist generation request
 */
export interface ChecklistGenerationRequest {
  /** Generation mode */
  generation_mode: GenerationMode;
  /** Session ID (required for GUIDED_CHAT and FREE_CHAT) */
  session_id?: string;
  /** Form data (required for FORM mode) */
  identity?: {
    filing_status?: string;
    income_range?: string;
    has_dependents?: boolean;
    num_dependents?: number;
    state?: string;
    has_self_employment?: boolean;
    has_investments?: boolean;
    has_rental_property?: boolean;
    has_education_expenses?: boolean;
    has_medical_expenses?: boolean;
    has_charitable_donations?: boolean;
    has_retirement_contributions?: boolean;
    additional_context?: string;
  };
}

// ============================================================
// Guided Chat Types (Path 2)
// ============================================================

/**
 * Guided question phases
 */
export enum QuestionPhase {
  FILING_STATUS = 'filing_status',
  INCOME_RANGE = 'income_range',
  DEPENDENTS = 'dependents',
  STATE = 'state',
  EMPLOYMENT = 'employment',
  INVESTMENTS = 'investments',
  DEDUCTIONS = 'deductions',
  ADDITIONAL = 'additional',
  COMPLETE = 'complete',
}

/**
 * Guided question option
 */
export interface QuestionOption {
  /** Option value */
  value: string;
  /** Option display label */
  label: string;
}

/**
 * Guided question
 */
export interface GuidedQuestion {
  /** Current phase */
  phase: QuestionPhase;
  /** Question text */
  question: string;
  /** Question type */
  question_type: 'single_choice' | 'multiple_choice' | 'text' | 'number' | 'boolean';
  /** Available options (for choice questions) */
  options?: QuestionOption[];
  /** Whether question is required */
  required: boolean;
  /** Progress percentage (0-100) */
  progress: number;
  /** Total number of questions */
  total_questions: number;
  /** Current question number */
  current_question: number;
}

/**
 * Guided answer request
 */
export interface GuidedAnswerRequest {
  /** User's answer */
  answer: string | string[] | number | boolean;
  /** Current phase being answered */
  phase: QuestionPhase;
}

// ============================================================
// SSE Event Types
// ============================================================

/**
 * SSE event type for chat streaming
 */
export type SSEEventType = 'chunk' | 'metadata' | 'done' | 'error';

/**
 * SSE chunk event
 */
export interface SSEChunkEvent {
  type: 'chunk';
  content: string;
}

/**
 * SSE metadata event
 */
export interface SSEMetadataEvent {
  type: 'metadata';
  intent?: IntentClassification;
  should_regenerate?: boolean;
  extracted_identity?: ExtractedIdentity;
}

/**
 * SSE done event
 */
export interface SSEDoneEvent {
  type: 'done';
}

/**
 * SSE error event
 */
export interface SSEErrorEvent {
  type: 'error';
  error: string;
}

/**
 * Union type for all SSE events
 */
export type SSEEvent = SSEChunkEvent | SSEMetadataEvent | SSEDoneEvent | SSEErrorEvent;
