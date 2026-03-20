// src/pages/ProjectDetail.tsx
// Single project view – shows all tasks with full CRUD, filtering, and stats

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchProject } from '../api/projects';
import { useTasks } from '../hooks/useTasks';
import { TaskItem } from '../components/TaskItem';
import { TaskForm } from '../components/TaskForm';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Spinner } from '../components/ui/Spinner';
import { Badge } from '../components/ui/Badge';
import { Project, Task, TaskFormData, TaskStatus, Priority } from '../types';

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE', label: 'Done' },
];

const PRIORITY_FILTER_OPTIONS = [
  { value: '', label: 'All priorities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
];

export function ProjectDetail() {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const projectId = parseInt(id ?? '0', 10);

  const [project, setProject]         = useState<Project | null>(null);
  const [projLoading, setProjLoading] = useState(true);
  const [projError, setProjError]     = useState('');

  const [statusFilter, setStatusFilter]     = useState<TaskStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | ''>('');

  const filters = {
    ...(statusFilter   && { status:   statusFilter   as TaskStatus }),
    ...(priorityFilter && { priority: priorityFilter as Priority   }),
  };

  const { tasks, isLoading, error, createNewTask, editTask, removeTask } =
    useTasks(projectId, Object.keys(filters).length > 0 ? filters : undefined);

  // Modal state
  const [createOpen, setCreateOpen]       = useState(false);
  const [editingTask, setEditingTask]     = useState<Task | null>(null);
  const [deletingTask, setDeletingTask]   = useState<Task | null>(null);
  const [formLoading, setFormLoading]     = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [successMsg, setSuccessMsg]       = useState('');

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  // Fetch project metadata
  useEffect(() => {
    if (!projectId) return;
    setProjLoading(true);
    fetchProject(projectId)
      .then(setProject)
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 404 || status === 403) navigate('/dashboard', { replace: true });
        else setProjError('Failed to load project.');
      })
      .finally(() => setProjLoading(false));
  }, [projectId, navigate]);

  const handleCreate = useCallback(async (data: TaskFormData) => {
    setFormLoading(true);
    try {
      await createNewTask(data);
      setCreateOpen(false);
      showSuccess('Task created!');
    } finally {
      setFormLoading(false);
    }
  }, [createNewTask]);

  const handleEdit = useCallback(async (data: TaskFormData) => {
    if (!editingTask) return;
    setFormLoading(true);
    try {
      await editTask(editingTask.id, data);
      setEditingTask(null);
      showSuccess('Task updated!');
    } finally {
      setFormLoading(false);
    }
  }, [editingTask, editTask]);

  const handleDelete = useCallback(async () => {
    if (!deletingTask) return;
    setDeleteLoading(true);
    try {
      await removeTask(deletingTask.id);
      setDeletingTask(null);
      showSuccess('Task deleted.');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingTask, removeTask]);

  const handleStatusChange = useCallback(
    async (task: Task, status: TaskStatus) => {
      await editTask(task.id, { status } as Partial<TaskFormData>);
    },
    [editTask]
  );

  // Task stats
  const stats = {
    total:      tasks.length,
    todo:       tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    done:       tasks.filter(t => t.status === 'DONE').length,
  };
  const donePercent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;

  if (projLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  if (projError) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div role="alert" className="text-center">
        <p className="text-red-600 font-medium mb-4">{projError}</p>
        <Button variant="secondary" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-gray-500">
            <li><Link to="/dashboard" className="hover:text-brand-600 transition-colors">Dashboard</Link></li>
            <li aria-hidden="true"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></li>
            <li className="text-gray-900 font-medium truncate max-w-xs" aria-current="page">
              {project?.title}
            </li>
          </ol>
        </nav>

        {/* Project header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{project?.title}</h1>
              {project?.description && (
                <p className="text-sm text-gray-500 mt-1">{project.description}</p>
              )}
            </div>
            <Button
              onClick={() => setCreateOpen(true)}
              size="sm"
              leftIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}
            >
              Add Task
            </Button>
          </div>

          {/* Progress bar */}
          {stats.total > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>{stats.done} of {stats.total} tasks complete</span>
                <span className="font-medium text-brand-600">{donePercent}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={donePercent} aria-valuemin={0} aria-valuemax={100} aria-label={`${donePercent}% complete`}>
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full transition-all duration-500"
                  style={{ width: `${donePercent}%` }}
                />
              </div>
              <div className="flex gap-4 mt-3">
                {[
                  { label: 'To Do',       count: stats.todo,       variant: 'default' as const },
                  { label: 'In Progress', count: stats.inProgress, variant: 'info'    as const },
                  { label: 'Done',        count: stats.done,       variant: 'success' as const },
                ].map(({ label, count, variant }) => (
                  <Badge key={label} variant={variant}>{count} {label}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <Select
            label=""
            aria-label="Filter by status"
            value={statusFilter}
            options={STATUS_FILTER_OPTIONS}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | '')}
            className="sm:w-44"
          />
          <Select
            label=""
            aria-label="Filter by priority"
            value={priorityFilter}
            options={PRIORITY_FILTER_OPTIONS}
            onChange={(e) => setPriorityFilter(e.target.value as Priority | '')}
            className="sm:w-44"
          />
          {(statusFilter || priorityFilter) && (
            <Button variant="ghost" size="sm" onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}>
              Clear filters
            </Button>
          )}
        </div>

        {/* Success toast */}
        {successMsg && (
          <div role="status" aria-live="polite" className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2 animate-slide-up">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            {successMsg}
          </div>
        )}

        {/* Tasks */}
        {isLoading ? (
          <div className="flex justify-center py-16" aria-label="Loading tasks">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">
            <p className="font-medium">{error}</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3" aria-hidden="true">📝</div>
            <h2 className="text-base font-semibold text-gray-700 mb-1">
              {statusFilter || priorityFilter ? 'No tasks match your filters' : 'No tasks yet'}
            </h2>
            <p className="text-sm text-gray-400 mb-5">
              {statusFilter || priorityFilter
                ? 'Try clearing the filters.'
                : 'Add your first task to get started.'}
            </p>
            {!statusFilter && !priorityFilter && (
              <Button size="sm" onClick={() => setCreateOpen(true)} leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              }>
                Add first task
              </Button>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-3" aria-label="Tasks list">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onEdit={setEditingTask}
                onDelete={setDeletingTask}
                onStatusChange={handleStatusChange}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Create task modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Add new task" size="lg">
        <TaskForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} isLoading={formLoading} />
      </Modal>

      {/* Edit task modal */}
      <Modal isOpen={!!editingTask} onClose={() => setEditingTask(null)} title="Edit task" size="lg">
        <TaskForm
          initialData={editingTask ?? undefined}
          onSubmit={handleEdit}
          onCancel={() => setEditingTask(null)}
          isLoading={formLoading}
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDelete}
        title="Delete task"
        message={`Are you sure you want to delete "${deletingTask?.title}"? This cannot be undone.`}
        confirmLabel="Delete task"
        isLoading={deleteLoading}
      />
    </div>
  );
}
