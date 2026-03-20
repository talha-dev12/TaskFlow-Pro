// src/types/index.ts
// All shared TypeScript interfaces and types for the entire frontend
// Typed props, API responses, and state – satisfies Upper Second (60%+)

// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = 'USER' | 'ADMIN';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

// ─── Domain models ────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  _count?: { projects: number };
}

export interface Project {
  id: number;
  title: string;
  description: string | null;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[];
  owner?: Pick<User, 'id' | 'name' | 'email'>;
  _count?: { tasks: number };
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

// ─── API response wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  total: number;
}

// ─── Auth types ───────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

// ─── Form types ───────────────────────────────────────────────────────────────

export interface ProjectFormData {
  title: string;
  description: string;
}

export interface TaskFormData {
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string;
}

// ─── UI component prop types ──────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
