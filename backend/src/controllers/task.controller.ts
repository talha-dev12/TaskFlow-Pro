// src/controllers/task.controller.ts
// Full CRUD for tasks – nested under projects
// All task operations verify project ownership before proceeding

import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/error.middleware';
import {
  isNonEmptyString,
  isValidPriority,
  isValidStatus,
  isValidDate,
} from '../utils/validators';
import { sanitizeString } from '../utils/sanitizers';

// ─── Helper: verify user owns the project ─────────────────────────────────────

async function assertProjectOwnership(
  projectId: number,
  userId: number
): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    throw new AppError('Project not found.', 404);
  }

  if (project.ownerId !== userId) {
    throw new AppError('You do not have permission to access this project.', 403);
  }
}

// ─── GET all tasks for a project ──────────────────────────────────────────────

/**
 * GET /api/projects/:projectId/tasks
 * Returns all tasks in a project.
 * Supports ?status= and ?priority= filter query params.
 */
export async function getTasksByProject(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const projectId = parseInt(req.params.projectId, 10);

    if (isNaN(projectId)) {
      throw new AppError('Invalid project ID.', 400);
    }

    await assertProjectOwnership(projectId, userId);

    // Optional filters
    const { status, priority } = req.query as {
      status?: string;
      priority?: string;
    };

    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        ...(status && isValidStatus(status) && { status }),
        ...(priority && isValidPriority(priority) && { priority }),
      },
      orderBy: [
        { status: 'asc' },      // TODO → IN_PROGRESS → DONE
        { createdAt: 'desc' },
      ],
    });

    res.status(200).json({
      success: true,
      data: { tasks, total: tasks.length },
    });
  } catch (err) {
    next(err);
  }
}

// ─── GET single task ──────────────────────────────────────────────────────────

/**
 * GET /api/projects/:projectId/tasks/:taskId
 * Returns a single task if the user owns the parent project.
 */
export async function getTaskById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const projectId = parseInt(req.params.projectId, 10);
    const taskId = parseInt(req.params.taskId, 10);

    if (isNaN(projectId) || isNaN(taskId)) {
      throw new AppError('Invalid project or task ID.', 400);
    }

    await assertProjectOwnership(projectId, userId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.projectId !== projectId) {
      throw new AppError('Task not found.', 404);
    }

    res.status(200).json({
      success: true,
      data: { task },
    });
  } catch (err) {
    next(err);
  }
}

// ─── CREATE task ──────────────────────────────────────────────────────────────

/**
 * POST /api/projects/:projectId/tasks
 * Creates a new task inside a project.
 */
export async function createTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const projectId = parseInt(req.params.projectId, 10);

    if (isNaN(projectId)) {
      throw new AppError('Invalid project ID.', 400);
    }

    await assertProjectOwnership(projectId, userId);

    const { title, description, priority, status, dueDate } = req.body as {
      title: string;
      description?: string;
      priority?: string;
      status?: string;
      dueDate?: string;
    };

    // ── Validation ────────────────────────────────────────────────────────────
    const errors: string[] = [];

    if (!title || !isNonEmptyString(title)) {
      errors.push('Task title is required.');
    }
    if (priority && !isValidPriority(priority)) {
      errors.push('Priority must be LOW, MEDIUM, or HIGH.');
    }
    if (status && !isValidStatus(status)) {
      errors.push('Status must be TODO, IN_PROGRESS, or DONE.');
    }
    if (dueDate && !isValidDate(dueDate)) {
      errors.push('Due date must be a valid date string.');
    }

    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    // ── Create ────────────────────────────────────────────────────────────────
    const task = await prisma.task.create({
      data: {
        title: sanitizeString(title),
        description: description ? sanitizeString(description) : undefined,
        priority: (priority as 'LOW' | 'MEDIUM' | 'HIGH') ?? 'MEDIUM',
        status: (status as 'TODO' | 'IN_PROGRESS' | 'DONE') ?? 'TODO',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        projectId,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      data: { task },
    });
  } catch (err) {
    next(err);
  }
}

// ─── UPDATE task ──────────────────────────────────────────────────────────────

/**
 * PUT /api/tasks/:taskId
 * Updates any combination of task fields.
 * User must own the task's parent project.
 */
export async function updateTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const taskId = parseInt(req.params.taskId, 10);

    if (isNaN(taskId)) {
      throw new AppError('Invalid task ID.', 400);
    }

    // Fetch task and verify ownership via its project
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new AppError('Task not found.', 404);
    }

    if (task.project.ownerId !== userId) {
      throw new AppError('You do not have permission to update this task.', 403);
    }

    const { title, description, priority, status, dueDate } = req.body as {
      title?: string;
      description?: string;
      priority?: string;
      status?: string;
      dueDate?: string | null;
    };

    // ── Validation ────────────────────────────────────────────────────────────
    const errors: string[] = [];

    if (title !== undefined && !isNonEmptyString(title)) {
      errors.push('Title must be a non-empty string under 255 characters.');
    }
    if (priority && !isValidPriority(priority)) {
      errors.push('Priority must be LOW, MEDIUM, or HIGH.');
    }
    if (status && !isValidStatus(status)) {
      errors.push('Status must be TODO, IN_PROGRESS, or DONE.');
    }
    if (dueDate && !isValidDate(dueDate)) {
      errors.push('Due date must be a valid date string.');
    }

    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed', errors });
      return;
    }

    // ── Update ────────────────────────────────────────────────────────────────
    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(title !== undefined && { title: sanitizeString(title) }),
        ...(description !== undefined && {
          description: description ? sanitizeString(description) : null,
        }),
        ...(priority && { priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' }),
        ...(status && { status: status as 'TODO' | 'IN_PROGRESS' | 'DONE' }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
      },
    });

    res.status(200).json({
      success: true,
      message: 'Task updated successfully.',
      data: { task: updated },
    });
  } catch (err) {
    next(err);
  }
}

// ─── DELETE task ──────────────────────────────────────────────────────────────

/**
 * DELETE /api/tasks/:taskId
 * Deletes a task. User must own the parent project.
 */
export async function deleteTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const taskId = parseInt(req.params.taskId, 10);

    if (isNaN(taskId)) {
      throw new AppError('Invalid task ID.', 400);
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new AppError('Task not found.', 404);
    }

    if (task.project.ownerId !== userId) {
      throw new AppError('You do not have permission to delete this task.', 403);
    }

    await prisma.task.delete({ where: { id: taskId } });

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}
