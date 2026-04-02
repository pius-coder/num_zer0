import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp, boolean, index, integer, uniqueIndex } from 'drizzle-orm/pg-core'
import { user } from './auth'

export const referral = pgTable(
  'referral',
  {
    id: text('id').primaryKey(),
    referrerId: text('referrer_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    refereeId: text('referee_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: text('status').default('pending').notNull(),
    totalEarningsCredits: integer('total_earnings_credits').default(0).notNull(),
    purchasesTracked: integer('purchases_tracked').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [uniqueIndex('referral_referee_unique').on(table.refereeId)]
)

export const referralRelations = relations(referral, ({ one }) => ({
  referrer: one(user, {
    fields: [referral.referrerId],
    references: [user.id],
    relationName: 'referrer',
  }),
  referee: one(user, {
    fields: [referral.refereeId],
    references: [user.id],
    relationName: 'referee',
  }),
}))
