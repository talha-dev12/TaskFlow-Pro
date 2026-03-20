// src/components/TaskForm.tsx
// Form for creating and editing tasks with full client-side validation

import React, { useState, useEffect } from 'react';
import { Task, TaskFormData, Priority, TaskStatus } from '../types';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Button } from './ui/Button';

interface TaskFormProps {
  initialData?: Task;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

interface FormErrors {
  title?: string;
  priority?: string;
  status?: string;
  dueDate?: string;
}

const PRIORITY_OPTIONS = [
  { value: 'LOW',    label: '🟢 Low'    },
  { value: 'MEDIUM', label: '🟡 Medium' },
  { value: 'HIGH',   label: '🔴 High'   },
];

const STATUS_OPTIONS = [
  { value: 'TODO',        label: 'To Do'       },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DONE',        label: 'Done'        },
];

export function TaskForm({ initialData, onSubmit, onCancel, isLoading }: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title:       initialData?.title        ?? '',
    description: initialData?.description  ?? '',
    priority:    initialData?.priority     ?? 'MEDIUM',
    status:      initialData?.status       ?? 'TODO',
    dueDate:     initialData?.dueDate
      ? initialData.dueDate.split('T')[0]
      : '',
  });
  const [errors, setErrors]           = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        title:       initialData.title,
        description: initialData.description ?? '',
        priority:    initialData.priority,
        status:      initialData.status,
        dueDate:     initialData.dueDate ? initialData.dueDate.split('T')[0] : '',
      });
    }
  }, [initialData]);

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required.';
    } else if (formData.title.trim().length > 255) {
      newErrors.title = 'Title must be under 255 characters.';
    }
    if (!['LOW', 'MEDIUM', 'HIGH'].includes(formData.priority)) {
      newErrors.priority = 'Please select a valid priority.';
    }
    if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(formData.status)) {
      newErrors.status = 'Please select a valid status.';
    }
    if (formData.dueDate && isNaN(new Date(formData.dueDate).getTime())) {
      newErrors.dueDate = 'Please enter a valid date.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    try {
      await onSubmit({
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  function set<K extends keyof TaskFormData>(key: K, value: TaskFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {submitError && (
        <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {submitError}
        </div>
      )}

      <Input
        label="Task Title"
        required
        value={formData.title}
        onChange={(e) => set('title', e.target.value)}
        error={errors.title}
        placeholder="e.g. Design landing page"
        autoFocus
      />

      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => set('description', e.target.value)}
        placeholder="Add details about this task… (optional)"
        rows={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Priority"
          required
          value={formData.priority}
          options={PRIORITY_OPTIONS}
          onChange={(e) => set('priority', e.target.value as Priority)}
          error={errors.priority}
        />
        <Select
          label="Status"
          required
          value={formData.status}
          options={STATUS_OPTIONS}
          onChange={(e) => set('status', e.target.value as TaskStatus)}
          error={errors.status}
        />
      </div>

      <Input
        label="Due Date"
        type="date"
        value={formData.dueDate}
        onChange={(e) => set('dueDate', e.target.value)}
        error={errors.dueDate}
        helperText="Optional – leave blank if no deadline"
        min={new Date().toISOString().split('T')[0]}
      />

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Save Changes' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}
