// src/components/TaskItem.tsx
// Single task row – shows status, priority, due date, edit/delete actions

import React, { useState } from 'react';
import { Task, TaskStatus, Priority } from '../types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { BadgeVariant } from '../types';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => Promise<void>;
}

const statusConfig: Record<TaskStatus, { label: string; variant: BadgeVariant; next: TaskStatus; nextLabel: string }> = {
  TODO:        { label: 'To Do',       variant: 'default', next: 'IN_PROGRESS', nextLabel: 'Start'    },
  IN_PROGRESS: { label: 'In Progress', variant: 'info',    next: 'DONE',        nextLabel: 'Complete' },
  DONE:        { label: 'Done',        variant: 'success', next: 'TODO',        nextLabel: 'Reopen'   },
};

const priorityConfig: Record<Priority, { variant: BadgeVariant; dot: string }> = {
  LOW:    { variant: 'default', dot: 'bg-gray-400'  },
  MEDIUM: { variant: 'warning', dot: 'bg-amber-400' },
  HIGH:   { variant: 'danger',  dot: 'bg-red-500'   },
};

export function TaskItem({ task, onEdit, onDelete, onStatusChange }: TaskItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const statusInfo   = statusConfig[task.status];
  const priorityInfo = priorityConfig[task.priority];

  const isOverdue =
    task.dueDate &&
    task.status !== 'DONE' &&
    isPast(parseISO(task.dueDate));

  async function handleStatusChange() {
    setIsUpdating(true);
    try {
      await onStatusChange(task, statusInfo.next);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <li
      className={`
        group flex items-start gap-4 p-4 rounded-xl border transition-all duration-150
        ${task.status === 'DONE'
          ? 'bg-gray-50 border-gray-100 opacity-70'
          : 'bg-white border-gray-100 hover:border-brand-200 hover:shadow-card'}
      `}
      aria-label={`Task: ${task.title}, status: ${statusInfo.label}, priority: ${task.priority}`}
    >
      {/* Status toggle button (checkbox-style) */}
      <button
        onClick={handleStatusChange}
        disabled={isUpdating}
        aria-label={`Mark as ${statusInfo.nextLabel}`}
        className={`
          mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
          transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500
          ${task.status === 'DONE'
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-brand-500'
          }
          ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {task.status === 'DONE' && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {task.status === 'IN_PROGRESS' && (
          <div className="w-2 h-2 rounded-full bg-blue-500" aria-hidden="true" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className={`text-sm font-medium ${task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {task.title}
          </span>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          <Badge variant={priorityInfo.variant}>
            <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dot}`} aria-hidden="true" />
            {task.priority}
          </Badge>
        </div>

        {task.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{task.description}</p>
        )}

        {task.dueDate && (
          <p className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {isOverdue ? 'Overdue · ' : 'Due '}
            {formatDistanceToNow(parseISO(task.dueDate), { addSuffix: true })}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(task)}
          aria-label={`Edit task ${task.title}`}
          leftIcon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(task)}
          aria-label={`Delete task ${task.title}`}
          className="text-red-400 hover:text-red-600 hover:bg-red-50"
          leftIcon={
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          }
        />
      </div>
    </li>
  );
}
