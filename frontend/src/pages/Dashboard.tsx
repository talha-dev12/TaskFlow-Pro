// src/pages/Dashboard.tsx
// Main dashboard – shows all projects, search, create/edit/delete

import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProjects } from '../hooks/useProjects';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectForm } from '../components/ProjectForm';
import { Modal, ConfirmModal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { Project, ProjectFormData } from '../types';

export function Dashboard() {
  const { user }  = useAuth();
  const [search, setSearch]           = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [searchTimer, setSearchTimer]   = useState<ReturnType<typeof setTimeout> | null>(null);

  const { projects, isLoading, error, createNewProject, editProject, removeProject } =
    useProjects(debouncedSearch || undefined);

  // Modal state
  const [createOpen, setCreateOpen]         = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [formLoading, setFormLoading]       = useState(false);
  const [deleteLoading, setDeleteLoading]   = useState(false);
  const [successMsg, setSuccessMsg]         = useState('');

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  }

  // Debounce search input
  function handleSearch(value: string) {
    setSearch(value);
    if (searchTimer) clearTimeout(searchTimer);
    const t = setTimeout(() => setDebounced(value), 400);
    setSearchTimer(t);
  }

  const handleCreate = useCallback(async (data: ProjectFormData) => {
    setFormLoading(true);
    try {
      await createNewProject(data);
      setCreateOpen(false);
      showSuccess('Project created successfully!');
    } finally {
      setFormLoading(false);
    }
  }, [createNewProject]);

  const handleEdit = useCallback(async (data: ProjectFormData) => {
    if (!editingProject) return;
    setFormLoading(true);
    try {
      await editProject(editingProject.id, data);
      setEditingProject(null);
      showSuccess('Project updated successfully!');
    } finally {
      setFormLoading(false);
    }
  }, [editingProject, editProject]);

  const handleDelete = useCallback(async () => {
    if (!deletingProject) return;
    setDeleteLoading(true);
    try {
      await removeProject(deletingProject.id);
      setDeletingProject(null);
      showSuccess('Project deleted.');
    } finally {
      setDeleteLoading(false);
    }
  }, [deletingProject, removeProject]);

  // Stats
  const totalTasks = projects.reduce((sum, p) => sum + (p._count?.tasks ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getGreeting()},{' '}
            <span className="text-brand-600">{user?.name.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Here's an overview of all your projects.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Projects" value={projects.length} icon="📁" color="brand" />
          <StatCard label="Total Tasks"    value={totalTasks}      icon="✅" color="green" />
          <StatCard
            label="Active Projects"
            value={projects.filter(p => (p._count?.tasks ?? 0) > 0).length}
            icon="🚀"
            color="purple"
            className="col-span-2 sm:col-span-1"
          />
        </div>

        {/* Success toast */}
        {successMsg && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2 animate-slide-up"
          >
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {successMsg}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <Input
              label=""
              placeholder="Search projects…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              aria-label="Search projects"
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            New Project
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20" aria-label="Loading projects">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 text-center">
            <p className="font-medium">{error}</p>
          </div>
        ) : projects.length === 0 ? (
          <EmptyState onCreate={() => setCreateOpen(true)} isSearching={!!debouncedSearch} />
        ) : (
          <ul
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
            aria-label="Projects list"
          >
            {projects.map((project) => (
              <li key={project.id}>
                <ProjectCard
                  project={project}
                  onEdit={setEditingProject}
                  onDelete={setDeletingProject}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Create modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create new project">
        <ProjectForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          isLoading={formLoading}
        />
      </Modal>

      {/* Edit modal */}
      <Modal isOpen={!!editingProject} onClose={() => setEditingProject(null)} title="Edit project">
        <ProjectForm
          initialData={editingProject ?? undefined}
          onSubmit={handleEdit}
          onCancel={() => setEditingProject(null)}
          isLoading={formLoading}
        />
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={!!deletingProject}
        onClose={() => setDeletingProject(null)}
        onConfirm={handleDelete}
        title="Delete project"
        message={`Are you sure you want to delete "${deletingProject?.title}"? All tasks inside it will also be deleted. This cannot be undone.`}
        confirmLabel="Delete project"
        isLoading={deleteLoading}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label, value, icon, color, className = '',
}: {
  label: string; value: number; icon: string; color: string; className?: string;
}) {
  const colorMap: Record<string, string> = {
    brand:  'bg-brand-50  border-brand-100  text-brand-700',
    green:  'bg-green-50  border-green-100  text-green-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
  };
  return (
    <div className={`rounded-2xl border p-5 ${colorMap[color] ?? colorMap.brand} ${className}`}>
      <div className="text-2xl mb-1" aria-hidden="true">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm opacity-80">{label}</p>
    </div>
  );
}

function EmptyState({ onCreate, isSearching }: { onCreate: () => void; isSearching: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4" aria-hidden="true">{isSearching ? '🔍' : '📋'}</div>
      <h2 className="text-lg font-semibold text-gray-700 mb-1">
        {isSearching ? 'No projects match your search' : 'No projects yet'}
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        {isSearching
          ? 'Try a different keyword.'
          : 'Create your first project to start organizing tasks.'}
      </p>
      {!isSearching && (
        <Button onClick={onCreate} leftIcon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        }>
          Create your first project
        </Button>
      )}
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
