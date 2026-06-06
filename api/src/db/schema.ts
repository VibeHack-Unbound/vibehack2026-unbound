import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

const timestamp = (name: string) => integer(name, { mode: 'timestamp' })
const boolean = (name: string) => integer(name, { mode: 'boolean' })

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: timestamp('updated_at').notNull().default(sql`(unixepoch())`),
})

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull().default(sql`(unixepoch())`),
    updatedAt: timestamp('updated_at').notNull().default(sql`(unixepoch())`),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_user_id_idx').on(table.userId)],
)

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull().default(sql`(unixepoch())`),
    updatedAt: timestamp('updated_at').notNull().default(sql`(unixepoch())`),
  },
  (table) => [index('account_user_id_idx').on(table.userId)],
)

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().default(sql`(unixepoch())`),
    updatedAt: timestamp('updated_at').notNull().default(sql`(unixepoch())`),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

export const submissions = sqliteTable(
  'submissions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
    teamName: text('team_name').notNull(),
    projectName: text('project_name').notNull(),
    description: text('description'),
    repoUrl: text('repo_url'),
    demoUrl: text('demo_url'),
    createdAt: integer('created_at', { mode: 'number' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    index('submissions_created_at_idx').on(table.createdAt),
    index('submissions_user_id_idx').on(table.userId),
  ],
)

export type Submission = typeof submissions.$inferSelect
export type NewSubmission = typeof submissions.$inferInsert
