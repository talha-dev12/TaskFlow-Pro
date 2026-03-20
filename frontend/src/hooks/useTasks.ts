// src/hooks/useTasks.ts
// Custom hook encapsulating all task state and CRUD operations for a project

import { useState, useEffect, useCallback } from 'react';
import { Task, TaskFormData, TaskStatus, Priority } from '../types';
import { fetchTasks, createTask, updateTask, deleteTask } from '../api/tasks';
import { AxiosError } from 'axios';

interface UseTasksReturn {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  createNewTask: (data: TaskFormData) => Promise<Task>;
  editTask: (taskId: number, data: Partial<TaskFormData>) => Promise<Task>;
  removeTask: (taskId: number) => Promise<void>;
  refresh: () => void;
}

export function useTasks(
  projectId: number,
  filters?: { status?: TaskStatus; priority?: Priority }
): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchTasks(projectId, filters)
      .then((data) => {
        if (!cancelled) {
          setTasks(data);
          setIsLoading(false);
        }
      })
      .catch((err: AxiosError<{ message: string }>) => {
        if (!cancelled) {
          setError(err.response?.data?.message ?? 'Failed to load tasks.');
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [projectId, filters?.status, filters?.priority, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const createNewTask = useCallback(
    async (data: TaskFormData): Promise<Task> => {
      const task = await createTask(projectId, data);
      setTasks((prev) => [task, ...prev]);
      return task;
    },
    [projectId]
  );

  const editTask = useCallback(
    async (taskId: number, data: Partial<TaskFormData>): Promise<Task> => {
      const updated = await updateTask(projectId, taskId, data);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      return updated;
    },
    [projectId]
  );

  const removeTask = useCallback(
    async (taskId: number): Promise<void> => {
      await deleteTask(projectId, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    },
    [projectId]
  );

  return { tasks, isLoading, error, createNewTask, editTask, removeTask, refresh };
}
