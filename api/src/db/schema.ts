import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const submissions = sqliteTable(
  'submissions',
  {
    id: text('id').primaryKey(),
    teamName: text('team_name').notNull(),
    projectName: text('project_name').notNull(),
    description: text('description'),
    repoUrl: text('repo_url'),
    demoUrl: text('demo_url'),
    createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [index('submissions_created_at_idx').on(table.createdAt)],
)

export type Submission = typeof submissions.$inferSelect
export type NewSubmission = typeof submissions.$inferInsert
