import { createServerFn } from '@tanstack/react-start'
import { getRequestHeader } from '@tanstack/react-start/server'

import { apiOrigin } from './auth'

export type Submission = {
  id: string
  teamName: string
  projectName: string
  description: string | null
  repoUrl: string | null
  demoUrl: string | null
  createdAt: number
}

type SubmissionListResponse = {
  data: Submission[]
}

export const getServerSubmissions = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Submission[]> => {
    const cookieHeader = getRequestHeader('cookie')
    if (!cookieHeader) return []

    const response = await fetch(`${apiOrigin}/submissions?limit=100`, {
      headers: {
        cookie: cookieHeader,
      },
    })

    if (!response.ok) return []

    const payload = (await response.json()) as SubmissionListResponse
    return payload.data
  },
)
