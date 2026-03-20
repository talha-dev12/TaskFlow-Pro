// src/components/ProjectCard.tsx
// Presentational card for a single project – shown on Dashboard

import React from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../types';
import { Button } from './ui/Button';
import { formatDistanceToNow } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const taskCount = project._count?.tasks ?? 0;

  return (
    <article
      className="bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover transition-shadow duration-200 flex flex-col group"
      aria-label={`Project: ${project.title}`}
    >
      {/* Coloured top stripe */}
      <div className="h-1.5 rounded-t-2xl bg-gradient-to-r from-brand-500 to-brand-400" aria-hidden="true" />

      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Title + task count */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link
              to={`/projects/${project.id}`}
              className="text-base font-semibold text-gray-900 hover:text-brand-600 transition-colors line-clamp-2 focus:outline-none focus-visible:underline"
            >
              {project.title}
            </Link>
            {project.description && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">{project.description}</p>
            )}
          </div>

          {/* Task count pill */}
          <span
            className="shrink-0 inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full border border-brand-100"
            aria-label={`${taskCount} task${taskCount !== 1 ? 's' : ''}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          <span className="text-xs text-gray-400">
            Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
          </span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(project)}
              aria-label={`Edit project ${project.title}`}
              leftIcon={
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
            >
              Edit
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(project)}
              aria-label={`Delete project ${project.title}`}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              leftIcon={
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              }
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
