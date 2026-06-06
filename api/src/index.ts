/// <reference types="@cloudflare/workers-types" />

import { apiReference } from '@scalar/hono-api-reference'
import { swaggerUI } from '@hono/swagger-ui'
import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { and, desc, eq } from 'drizzle-orm'
import { cors } from 'hono/cors'

import { createAuth, type AuthBindings } from './auth'
import { createDb } from './db/client'
import { submissions, type Submission } from './db/schema'

type Bindings = AuthBindings & {
  DB: D1Database
  DEEPGRAM_API_KEY?: string
}

type RequestContext = {
  env: Bindings
  req: {
    raw: Request
  }
}

const app = new OpenAPIHono<{ Bindings: Bindings }>()

const DEEPGRAM_STREAM_URL = 'wss://api.deepgram.com/v1/listen'

const deepgramDictationUrl = () => {
  const url = new URL(DEEPGRAM_STREAM_URL)
  url.search = new URLSearchParams({
    model: 'nova-3',
    punctuate: 'true',
    dictation: 'true',
    smart_format: 'true',
    interim_results: 'true',
    endpointing: '250',
  }).toString()
  return url
}

const isSocketOpen = (socket: WebSocket) => socket.readyState === WebSocket.OPEN

const closeSocket = (socket: WebSocket, code = 1000, reason = '') => {
  if (socket.readyState !== WebSocket.OPEN && socket.readyState !== WebSocket.CONNECTING) return

  try {
    socket.close(code, reason)
  } catch {
    socket.close(1000)
  }
}

const sendSocketJson = (socket: WebSocket, payload: unknown) => {
  if (isSocketOpen(socket)) {
    socket.send(JSON.stringify(payload))
  }
}

const sendSocketData = (socket: WebSocket, data: unknown) => {
  if (!isSocketOpen(socket)) return

  if (typeof data === 'string' || data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
    socket.send(data)
  }
}

const toErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'WebSocket proxy error'

const proxyDeepgramDictation = async (request: Request, apiKey: string) => {
  if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 })
  }

  const deepgramResponse = await fetch(deepgramDictationUrl(), {
    headers: {
      Authorization: `Token ${apiKey}`,
      Upgrade: 'websocket',
    },
  })

  const deepgramSocket = deepgramResponse.webSocket
  if (!deepgramSocket) {
    return new Response('Deepgram did not accept the WebSocket connection', { status: 502 })
  }

  const pair = new WebSocketPair()
  const [clientSocket, browserSocket] = Object.values(pair)
  browserSocket.accept({ allowHalfOpen: true })
  deepgramSocket.accept({ allowHalfOpen: true })

  browserSocket.addEventListener('message', (event) => {
    try {
      sendSocketData(deepgramSocket, event.data)
    } catch (error) {
      sendSocketJson(browserSocket, {
        type: 'ProxyError',
        error: toErrorMessage(error),
      })
      closeSocket(browserSocket, 1011, 'Failed to forward audio')
      closeSocket(deepgramSocket, 1011, 'Failed to forward audio')
    }
  })

  deepgramSocket.addEventListener('message', (event) => {
    try {
      sendSocketData(browserSocket, event.data)
    } catch (error) {
      console.error('Failed to forward Deepgram message', error)
      closeSocket(browserSocket, 1011, 'Failed to forward transcript')
      closeSocket(deepgramSocket, 1011, 'Failed to forward transcript')
    }
  })

  browserSocket.addEventListener('close', (event) => {
    if (isSocketOpen(deepgramSocket)) {
      deepgramSocket.send(JSON.stringify({ type: 'CloseStream' }))
    }
    closeSocket(deepgramSocket, event.code, event.reason)
  })

  deepgramSocket.addEventListener('close', (event) => {
    closeSocket(browserSocket, event.code, event.reason)
  })

  browserSocket.addEventListener('error', (event) => {
    console.error('Browser dictation socket error', event)
    closeSocket(deepgramSocket, 1011, 'Browser socket error')
  })

  deepgramSocket.addEventListener('error', (event) => {
    console.error('Deepgram dictation socket error', event)
    sendSocketJson(browserSocket, {
      type: 'ProxyError',
      error: 'Deepgram socket error',
    })
    closeSocket(browserSocket, 1011, 'Deepgram socket error')
  })

  return new Response(null, {
    status: 101,
    webSocket: clientSocket,
  })
}

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

const unauthorizedResponse = {
  description: 'Authentication required',
  content: {
    'application/json': {
      schema: ErrorSchema,
    },
  },
} as const

const toResponse = (submission: Submission) => ({
  id: submission.id,
  teamName: submission.teamName,
  projectName: submission.projectName,
  description: submission.description,
  repoUrl: submission.repoUrl,
  demoUrl: submission.demoUrl,
  createdAt: submission.createdAt,
})

const createRequestAuth = (c: RequestContext) => createAuth(c.env, createDb(c.env.DB), c.req.raw)

const getCurrentSession = (c: RequestContext) =>
  createRequestAuth(c).api.getSession({
    headers: c.req.raw.headers,
  })

function allowedOrigins(env: Bindings) {
  return new Set([
    env.WEB_ORIGIN,
    env.BETTER_AUTH_URL,
    'http://localhost:3000',
    'http://localhost:8787',
  ].filter((origin): origin is string => Boolean(origin)))
}

app.use(
  '*',
  cors({
    origin: (origin, c) => {
      if (!origin) return origin
      return allowedOrigins(c.env).has(origin) ? origin : undefined
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
)

app.on(['GET', 'POST'], '/api/auth/*', (c) => createRequestAuth(c).handler(c.req.raw))

app.get('/api/me', async (c) => {
  const session = await getCurrentSession(c)

  if (!session) {
    return c.json({ error: 'Authentication required' }, 401)
  }

  return c.json(session)
})

app.get('/', (c) =>
  c.json({
    name: 'Unbound API',
    docs: '/docs',
    swagger: '/swagger',
    openapi: '/openapi.json',
    dictationStream: '/dictation/stream',
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

app.get('/dictation/stream', async (c) => {
  const apiKey = c.env.DEEPGRAM_API_KEY?.trim()

  if (!apiKey) {
    return c.json({ error: 'DEEPGRAM_API_KEY is not configured' }, 500)
  }

  const session = await getCurrentSession(c)
  if (!session) {
    return c.json({ error: 'Authentication required' }, 401)
  }

  return proxyDeepgramDictation(c.req.raw, apiKey)
})

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
      401: unauthorizedResponse,
    },
  }),
  async (c) => {
    const session = await getCurrentSession(c)
    if (!session) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const { limit } = c.req.valid('query')
    const db = createDb(c.env.DB)
    const rows = await db
      .select()
      .from(submissions)
      .where(eq(submissions.userId, session.user.id))
      .orderBy(desc(submissions.createdAt))
      .limit(limit)

    return c.json({ data: rows.map(toResponse) }, 200)
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
      401: unauthorizedResponse,
    },
  }),
  async (c) => {
    const session = await getCurrentSession(c)
    if (!session) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const body = c.req.valid('json')
    const id = crypto.randomUUID()
    const db = createDb(c.env.DB)

    await db.insert(submissions).values({
      id,
      userId: session.user.id,
      teamName: body.teamName,
      projectName: body.projectName,
      description: body.description ?? null,
      repoUrl: body.repoUrl ?? null,
      demoUrl: body.demoUrl ?? null,
    })

    const [created] = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.id, id), eq(submissions.userId, session.user.id)))
      .limit(1)
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
      401: unauthorizedResponse,
    },
  }),
  async (c) => {
    const session = await getCurrentSession(c)
    if (!session) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    const db = createDb(c.env.DB)

    if (Object.values(body).every((value) => value === undefined)) {
      return c.json({ error: 'No changes provided' }, 400)
    }

    const [existing] = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.id, id), eq(submissions.userId, session.user.id)))
      .limit(1)

    if (!existing) {
      return c.json({ error: 'Submission not found' }, 404)
    }

    await db
      .update(submissions)
      .set(body)
      .where(and(eq(submissions.id, id), eq(submissions.userId, session.user.id)))

    const [updated] = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.id, id), eq(submissions.userId, session.user.id)))
      .limit(1)
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
      401: unauthorizedResponse,
    },
  }),
  async (c) => {
    const session = await getCurrentSession(c)
    if (!session) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const { id } = c.req.valid('param')
    const db = createDb(c.env.DB)
    const [existing] = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.id, id), eq(submissions.userId, session.user.id)))
      .limit(1)

    if (!existing) {
      return c.json({ error: 'Submission not found' }, 404)
    }

    await db
      .delete(submissions)
      .where(and(eq(submissions.id, id), eq(submissions.userId, session.user.id)))
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
      401: unauthorizedResponse,
    },
  }),
  async (c) => {
    const session = await getCurrentSession(c)
    if (!session) {
      return c.json({ error: 'Authentication required' }, 401)
    }

    const { id } = c.req.valid('param')
    const db = createDb(c.env.DB)
    const [submission] = await db
      .select()
      .from(submissions)
      .where(and(eq(submissions.id, id), eq(submissions.userId, session.user.id)))
      .limit(1)

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
