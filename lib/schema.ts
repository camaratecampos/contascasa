import { sql } from 'drizzle-orm';
import { text, real, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  value_date: text('value_date'),
  description: text('description').notNull(),
  debit: real('debit'),
  credit: real('credit'),
  balance: real('balance'),
  bank: text('bank').notNull(), // 'novobanco' | 'millennium'
  owner: text('owner').notNull(), // 'Rodrigo' | 'Mariana'
  category: text('category'),
  subcategory: text('subcategory'),
  status: text('status').notNull().default('pending'),
  import_batch: text('import_batch'),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export const classification_rules = sqliteTable('classification_rules', {
  id: text('id').primaryKey(),
  keyword: text('keyword').notNull(),
  category: text('category').notNull(),
  subcategory: text('subcategory').notNull().default(''),
  priority: integer('priority').notNull().default(0),
  created_at: text('created_at').default(sql`(datetime('now'))`),
});

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type ClassificationRule = typeof classification_rules.$inferSelect;
export type NewClassificationRule = typeof classification_rules.$inferInsert;
