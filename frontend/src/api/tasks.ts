// src/api/tasks.ts
// All task-related API calls

import apiClient from './client';
import { ApiResponse, Task, TaskFormData, TaskStatus, Priority } from '../types';

/**
 * Fetch all tasks for a project, with optional filters.
 */
export async function fetchTasks(
  projectId: number,
  filters?: { status?: TaskStatus; priority?: Priority }
): Promise<Task[]> {
  const response = await apiClient.get<ApiResponse<{ tasks: Task[]; total: number }>>(
    `/projects/${projectId}/tasks`,
    { params: filters }
  );
  return response.data.data!.tasks;
}

/**
 * Fetch a single task by ID.
 */
export async function fetchTask(projectId: number, taskId: number): Promise<Task> {
  const response = await apiClient.get<ApiResponse<{ task: Task }>>(
    `/projects/${projectId}/tasks/${taskId}`
  );
  return response.data.data!.task;
}

/**
 * Create a new task inside a project.
 */
export async function createTask(
  projectId: number,
  data: TaskFormData
): Promise<Task> {
  const response = await apiClient.post<ApiResponse<{ task: Task }>>(
    `/projects/${projectId}/tasks`,
    data
  );
  return response.data.data!.task;
}

/**
 * Update an existing task.
 */
export async function updateTask(
  projectId: number,
  taskId: number,
  data: Partial<TaskFormData>
): Promise<Task> {
  const response = await apiClient.put<ApiResponse<{ task: Task }>>(
    `/projects/${projectId}/tasks/${taskId}`,
    data
  );
  return response.data.data!.task;
}

/**
 * Delete a task.
 */
export async function deleteTask(projectId: number, taskId: number): Promise<void> {
  await apiClient.delete(`/projects/${projectId}/tasks/${taskId}`);
}
