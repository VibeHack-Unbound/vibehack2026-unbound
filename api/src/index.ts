/// <reference types="@cloudflare/workers-types" />

import { apiReference } from '@scalar/hono-api-reference'
import { swaggerUI } from '@hono/swagger-ui'
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { desc, eq } from 'drizzle-orm'
import { cors } from 'hono/cors'

import { createDb } from './db/client'
import { submissions, type Submission } from './db/schema'

type Bindings = {
  DB: D1Database
}

const app = new OpenAPIHono<{ Bindings: Bindings }>()

const SubmissionSchema = z
  .object({
    id: z.string().uuid().openapi({ example: '018fcb46-35d2-7c3d-9f4c-a0f37c3b89a4' }),
    teamName: z.string().openapi({ example: 'Team Unbound' }),
    projectName: z.string().openapi({ example: 'Unbound' }),
    description: z.string().nullable().openapi({ example: 'A space for discovering what is next.' }),
    repoUrl: z.string().url().nullable().openapi({ example: 'https://github.com/example/unbound' }),
    demoUrl: z.string().url().nullable().openapi({ example: 'https://unbound.example.com' }),
    createdAt: z.number().int().openapi({ example: 1780758000 }),
  })
  .openapi('Submission')

const CreateSubmissionSchema = z
  .object({
    teamName: z.string().min(1).max(120).openapi({ example: 'Team Unbound' }),
    projectName: z.string().min(1).max(160).openapi({ example: 'Unbound' }),
    description: z.string().max(2000).optional().openapi({
      example: 'A space for discovering what is next.',
    }),
    repoUrl: z.string().url().optional().openapi({ example: 'https://github.com/example/unbound' }),
    demoUrl: z.string().url().optional().openapi({ example: 'https://unbound.example.com' }),
  })
  .openapi('CreateSubmission')

const UpdateSubmissionSchema = z
  .object({
    teamName: z.string().min(1).max(120).optional().openapi({ example: 'Team Unbound' }),
    projectName: z.string().min(1).max(160).optional().openapi({ example: 'Unbound' }),
    description: z.string().max(2000).nullable().optional().openapi({
      example: 'A space for discovering what is next.',
    }),
    repoUrl: z
      .string()
      .url()
      .nullable()
      .optional()
      .openapi({ example: 'https://github.com/example/unbound' }),
    demoUrl: z
      .string()
      .url()
      .nullable()
      .optional()
      .openapi({ example: 'https://unbound.example.com' }),
  })
  .openapi('UpdateSubmission')

const ErrorSchema = z
  .object({
    error: z.string().openapi({ example: 'Submission not found' }),
  })
  .openapi('Error')

const toResponse = (submission: Submission) => ({
  id: submission.id,
  teamName: submission.teamName,
  projectName: submission.projectName,
  description: submission.description,
  repoUrl: submission.repoUrl,
  demoUrl: submission.demoUrl,
  createdAt: submission.createdAt,
})

app.use(
  '*',
  cors({
    origin: (origin) => origin || '*',
    allowHeaders: ['Content-Type'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
)

app.get('/', (c) =>
  c.json({
    name: 'Unbound API',
    docs: '/docs',
    swagger: '/swagger',
    openapi: '/openapi.json',
  }),
)

app.openapi(
  createRoute({
    method: 'get',
    path: '/health',
    responses: {
      200: {
        description: 'API health check',
        content: {
          'application/json': {
            schema: z.object({
              status: z.literal('ok'),
            }),
          },
        },
      },
    },
  }),
  (c) => c.json({ status: 'ok' as const }),
)

app.openapi(
  createRoute({
    method: 'get',
    path: '/submissions',
    request: {
      query: z.object({
        limit: z.coerce.number().int().min(1).max(100).default(25).openapi({
          example: 25,
        }),
      }),
    },
    responses: {
      200: {
        description: 'List submissions',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(SubmissionSchema),
            }),
          },
        },
      },
    },
  }),
  async (c) => {
    const { limit } = c.req.valid('query')
    const db = createDb(c.env.DB)
    const rows = await db.select().from(submissions).orderBy(desc(submissions.createdAt)).limit(limit)

    return c.json({ data: rows.map(toResponse) })
  },
)

app.openapi(
  createRoute({
    method: 'post',
    path: '/submissions',
    request: {
      body: {
        required: true,
        content: {
          'application/json': {
            schema: CreateSubmissionSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Created submission',
        content: {
          'application/json': {
            schema: SubmissionSchema,
          },
        },
      },
      400: {
        description: 'Invalid submission',
        content: {
          'application/json': {
            schema: ErrorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const body = c.req.valid('json')
    const id = crypto.randomUUID()
    const db = createDb(c.env.DB)

    await db.insert(submissions).values({
      id,
      teamName: body.teamName,
      projectName: body.projectName,
      description: body.description ?? null,
      repoUrl: body.repoUrl ?? null,
      demoUrl: body.demoUrl ?? null,
    })

    const [created] = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1)
    if (!created) {
      return c.json({ error: 'Submission could not be created' }, 400)
    }

    return c.json(toResponse(created), 201)
  },
)

app.openapi(
  createRoute({
    method: 'patch',
    path: '/submissions/{id}',
    request: {
      params: z.object({
        id: z.string().uuid().openapi({
          param: {
            name: 'id',
            in: 'path',
          },
          example: '018fcb46-35d2-7c3d-9f4c-a0f37c3b89a4',
        }),
      }),
      body: {
        required: true,
        content: {
          'application/json': {
            schema: UpdateSubmissionSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Updated submission',
        content: {
          'application/json': {
            schema: SubmissionSchema,
          },
        },
      },
      400: {
        description: 'Invalid submission update',
        content: {
          'application/json': {
            schema: ErrorSchema,
          },
        },
      },
      404: {
        description: 'Submission not found',
        content: {
          'application/json': {
            schema: ErrorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    const db = createDb(c.env.DB)

    if (Object.values(body).every((value) => value === undefined)) {
      return c.json({ error: 'No changes provided' }, 400)
    }

    const [existing] = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1)

    if (!existing) {
      return c.json({ error: 'Submission not found' }, 404)
    }

    await db.update(submissions).set(body).where(eq(submissions.id, id))

    const [updated] = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1)
    if (!updated) {
      return c.json({ error: 'Submission could not be updated' }, 400)
    }

    return c.json(toResponse(updated), 200)
  },
)

app.openapi(
  createRoute({
    method: 'delete',
    path: '/submissions/{id}',
    request: {
      params: z.object({
        id: z.string().uuid().openapi({
          param: {
            name: 'id',
            in: 'path',
          },
          example: '018fcb46-35d2-7c3d-9f4c-a0f37c3b89a4',
        }),
      }),
    },
    responses: {
      204: {
        description: 'Deleted submission',
      },
      404: {
        description: 'Submission not found',
        content: {
          'application/json': {
            schema: ErrorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param')
    const db = createDb(c.env.DB)
    const [existing] = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1)

    if (!existing) {
      return c.json({ error: 'Submission not found' }, 404)
    }

    await db.delete(submissions).where(eq(submissions.id, id))
    return c.body(null, 204)
  },
)

app.openapi(
  createRoute({
    method: 'get',
    path: '/submissions/{id}',
    request: {
      params: z.object({
        id: z.string().uuid().openapi({
          param: {
            name: 'id',
            in: 'path',
          },
          example: '018fcb46-35d2-7c3d-9f4c-a0f37c3b89a4',
        }),
      }),
    },
    responses: {
      200: {
        description: 'Get a submission by ID',
        content: {
          'application/json': {
            schema: SubmissionSchema,
          },
        },
      },
      404: {
        description: 'Submission not found',
        content: {
          'application/json': {
            schema: ErrorSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { id } = c.req.valid('param')
    const db = createDb(c.env.DB)
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1)

    if (!submission) {
      return c.json({ error: 'Submission not found' }, 404)
    }

    return c.json(toResponse(submission), 200)
  },
)

app.doc('/openapi.json', {
  openapi: '3.0.0',
  info: {
    title: 'Unbound API',
    version: '0.1.0',
    description: 'Cloudflare Worker API backed by D1 and Drizzle ORM.',
  },
})

app.get(
  '/docs',
  apiReference({
    spec: {
      url: '/openapi.json',
    },
  }),
)

app.get('/swagger', swaggerUI({ url: '/openapi.json' }))

app.notFound((c) => c.json({ error: 'Not found' }, 404))

app.onError((error, c) => {
  console.error(error)
  return c.json({ error: 'Internal server error' }, 500)
})

export type AppType = typeof app

export default app
