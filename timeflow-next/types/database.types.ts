// Compact database types for the TimeFlow Supabase/Postgres schema.
// Generated via MCP `generate_typescript_types`, but kept minimal for maintainability.

export type DamageCode = "routine" | "overload" | "chaos";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done" | "archived";
export type TimerMode = "work" | "short_break";
export type TimerSessionStatus = "active" | "completed";

export type UUID = string;

export interface UsersRow {
  id: UUID;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  metrics: Record<string, unknown>; // jsonb
  created_at: string; // timestamptz as ISO string
  updated_at: string; // timestamptz as ISO string
}

export interface ProfilesRow {
  id: UUID;
  user_id: UUID;
  focus_level: number;
  energy_level: number;
  self_control_level: number;
  creativity_level: number;
  created_at: string;
  updated_at: string;
}

export interface DamageTypesRow {
  id: UUID;
  code: DamageCode;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TasksRow {
  id: UUID;
  user_id: UUID;
  title: string;
  description: string | null;
  scheduled_date: string | null; // timestamptz
  deadline: string | null; // timestamptz
  due_date: string | null; // generated from deadline
  priority: TaskPriority;
  status: TaskStatus;
  damage_type_id: UUID;
  damage_type: string | null; // synced from damage_type_id
  completed_at: string | null; // timestamptz
  created_at: string;
  updated_at: string;
}

export interface ToolsRow {
  id: UUID;
  name: string;
  description: string;
  instructions: string | null;
  is_active: boolean;
  tags: string[]; // text[]
  created_at: string;
}

export interface RecommendationsRow {
  id: UUID;
  task_id: UUID;
  tool_id: UUID;
  score: number;
  reason_text: string;
  created_at: string;
  accepted_at: string | null;
}

export interface TimerSessionsRow {
  id: UUID;
  user_id: UUID;
  task_id: UUID;
  mode: TimerMode;
  status: TimerSessionStatus;
  started_at: string;
  finished_at: string | null;
  work_seconds: number;
  break_seconds: number;
  duration: number; // generated from work_seconds + break_seconds
  created_at: string;
  updated_at: string;
}

export interface ReflectionNotesRow {
  id: UUID;
  session_id: UUID;
  content: string;
  created_at: string;
}

