export type DamageTypeCode = "routine" | "overload" | "chaos";

export type TaskPriority = "low" | "medium" | "high";

export type TaskStatus = "todo" | "in_progress" | "done" | "archived";

export interface Profile {
  focus: number;
  energy: number;
  selfControl: number;
  creativity: number;
}

export interface UserModel {
  id: string;
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  profile?: Profile | null;
}

export interface TaskModel {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  scheduledDate?: string | null;
  deadline?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  damageType: DamageTypeCode;
}

export interface ToolModel {
  id: string;
  name: string;
  description: string;
  instructions?: string | null;
}

export interface RecommendationModel {
  id: string;
  taskId: string;
  toolId: string;
  score: number;
  reasonText: string;
}

export type TimerMode = "work" | "short_break";
export type TimerSessionStatus = "active" | "completed";

export interface TimerSessionModel {
  id: string;
  userId: string;
  taskId: string;
  mode: TimerMode;
  status: TimerSessionStatus;
  startedAt: string;
  finishedAt?: string | null;
  workSeconds: number;
  breakSeconds: number;
}

export interface ReflectionNoteModel {
  id: string;
  sessionId: string;
  content: string;
  createdAt: string;
}

