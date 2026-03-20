// src/config/swagger.ts
// Swagger/OpenAPI documentation setup (60%+ Upper Second requirement)

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Application } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TaskFlow Pro API',
      version: '1.0.0',
      description:
        'Full-stack task and project management REST API. ' +
        'Built with Node.js, Express, TypeScript, Prisma, and PostgreSQL. ' +
        'COM5409 – Web Design and Programming, University of Greater Manchester.',
      contact: {
        name: 'TaskFlow Pro',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT ?? 4000}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        // JWT Bearer token auth scheme
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'Enter your JWT token. Obtain it from POST /api/auth/login or POST /api/auth/register.',
        },
      },
      schemas: {
        // Reusable schema components for cleaner route docs
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['USER', 'ADMIN'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            ownerId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE'] },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            projectId: { type: 'integer' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: { type: 'string' },
            },
          },
        },
      },
    },
    // Apply bearerAuth globally so it appears on all endpoints
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Projects', description: 'Project management endpoints' },
      { name: 'Tasks', description: 'Task management endpoints' },
    ],
  },
  // Scan all route files for @swagger JSDoc comments
  apis: ['./src/routes/*.ts'],
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Register Swagger UI at /api-docs.
 * Access at: http://localhost:4000/api-docs
 */
export function setupSwagger(app: Application): void {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'TaskFlow Pro API Docs',
      swaggerOptions: {
        persistAuthorization: true, // Keep the token across page refreshes
      },
    })
  );

  // Also expose the raw JSON spec at /api-docs.json
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(
    `📄 Swagger docs available at http://localhost:${process.env.PORT ?? 4000}/api-docs`
  );
}
