// src/api/projects.ts
// All project-related API calls

import apiClient from './client';
import { ApiResponse, Project, ProjectFormData } from '../types';

/**
 * Fetch all projects for the authenticated user.
 */
export async function fetchProjects(search?: string): Promise<Project[]> {
  const params = search ? { search } : {};
  const response = await apiClient.get<ApiResponse<{ projects: Project[]; total: number }>>(
    '/projects',
    { params }
  );
  return response.data.data!.projects;
}

/**
 * Fetch a single project by ID, including its tasks.
 */
export async function fetchProject(id: number): Promise<Project> {
  const response = await apiClient.get<ApiResponse<{ project: Project }>>(
    `/projects/${id}`
  );
  return response.data.data!.project;
}

/**
 * Create a new project.
 */
export async function createProject(data: ProjectFormData): Promise<Project> {
  const response = await apiClient.post<ApiResponse<{ project: Project }>>(
    '/projects',
    data
  );
  return response.data.data!.project;
}

/**
 * Update an existing project.
 */
export async function updateProject(
  id: number,
  data: Partial<ProjectFormData>
): Promise<Project> {
  const response = await apiClient.put<ApiResponse<{ project: Project }>>(
    `/projects/${id}`,
    data
  );
  return response.data.data!.project;
}

/**
 * Delete a project by ID.
 */
export async function deleteProject(id: number): Promise<void> {
  await apiClient.delete(`/projects/${id}`);
}
