// src/hooks/useProjects.ts
// Custom hook encapsulating all project state and CRUD operations
// Demonstrates custom hooks with useState + useEffect (50%+ requirement)

import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectFormData } from '../types';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../api/projects';
import { AxiosError } from 'axios';

interface UseProjectsReturn {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  createNewProject: (data: ProjectFormData) => Promise<Project>;
  editProject: (id: number, data: Partial<ProjectFormData>) => Promise<Project>;
  removeProject: (id: number) => Promise<void>;
  refresh: () => void;
}

export function useProjects(search?: string): UseProjectsReturn {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Fetch projects whenever search term or refreshKey changes
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchProjects(search)
      .then((data) => {
        if (!cancelled) {
          setProjects(data);
          setIsLoading(false);
        }
      })
      .catch((err: AxiosError<{ message: string }>) => {
        if (!cancelled) {
          setError(err.response?.data?.message ?? 'Failed to load projects.');
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [search, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const createNewProject = useCallback(async (data: ProjectFormData): Promise<Project> => {
    const project = await createProject(data);
    setProjects((prev) => [project, ...prev]);
    return project;
  }, []);

  const editProject = useCallback(
    async (id: number, data: Partial<ProjectFormData>): Promise<Project> => {
      const updated = await updateProject(id, data);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    },
    []
  );

  const removeProject = useCallback(async (id: number): Promise<void> => {
    await deleteProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { projects, isLoading, error, createNewProject, editProject, removeProject, refresh };
}
