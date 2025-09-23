import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for admin authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trainers table
export const trainers = pgTable("trainers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  specialties: text("specialties").array().notNull().default(sql`'{}'::text[]`),
  maxHoursPerWeek: integer("max_hours_per_week").notNull(),
  currentHoursPerWeek: integer("current_hours_per_week").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  absences: jsonb("absences").$type<Array<{start: string, end: string, reason: string}>>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

// Modules table
export const modules = pgTable("modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  totalHours: integer("total_hours").notNull(),
  sessionsPerWeek: integer("sessions_per_week").notNull(),
  hoursPerSession: decimal("hours_per_session", { precision: 4, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'theoretical' | 'practical'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Rooms table
export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'classroom' | 'workshop'
  capacity: integer("capacity").notNull(),
  equipment: text("equipment").array().default(sql`'{}'::text[]`),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Training Groups table
export const trainingGroups = pgTable("training_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  participantCount: integer("participant_count").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  estimatedEndDate: timestamp("estimated_end_date"),
  status: text("status").notNull().default("planned"), // 'planned' | 'active' | 'completed' | 'delayed'
  delayDays: integer("delay_days").default(0),
  roomId: varchar("room_id").references(() => rooms.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Module assignments to trainers
export const moduleTrainerAssignments = pgTable("module_trainer_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  moduleId: varchar("module_id").notNull().references(() => modules.id),
  trainerId: varchar("trainer_id").notNull().references(() => trainers.id),
  canTeach: boolean("can_teach").notNull().default(true),
});

// Group module schedule
export const groupModuleSchedule = pgTable("group_module_schedule", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => trainingGroups.id),
  moduleId: varchar("module_id").notNull().references(() => modules.id),
  trainerId: varchar("trainer_id").notNull().references(() => trainers.id),
  scheduledOrder: integer("scheduled_order").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  progress: integer("progress").default(0), // percentage 0-100
  hoursCompleted: decimal("hours_completed", { precision: 4, scale: 2 }).default("0"),
  status: text("status").default("planned"), // 'planned' | 'active' | 'completed'
});

// Relations
export const trainersRelations = relations(trainers, ({ many }) => ({
  moduleAssignments: many(moduleTrainerAssignments),
  groupSchedules: many(groupModuleSchedule),
}));

export const modulesRelations = relations(modules, ({ many }) => ({
  trainerAssignments: many(moduleTrainerAssignments),
  groupSchedules: many(groupModuleSchedule),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  trainingGroups: many(trainingGroups),
}));

export const trainingGroupsRelations = relations(trainingGroups, ({ one, many }) => ({
  room: one(rooms, {
    fields: [trainingGroups.roomId],
    references: [rooms.id],
  }),
  moduleSchedules: many(groupModuleSchedule),
}));

export const moduleTrainerAssignmentsRelations = relations(moduleTrainerAssignments, ({ one }) => ({
  module: one(modules, {
    fields: [moduleTrainerAssignments.moduleId],
    references: [modules.id],
  }),
  trainer: one(trainers, {
    fields: [moduleTrainerAssignments.trainerId],
    references: [trainers.id],
  }),
}));

export const groupModuleScheduleRelations = relations(groupModuleSchedule, ({ one }) => ({
  group: one(trainingGroups, {
    fields: [groupModuleSchedule.groupId],
    references: [trainingGroups.id],
  }),
  module: one(modules, {
    fields: [groupModuleSchedule.moduleId],
    references: [modules.id],
  }),
  trainer: one(trainers, {
    fields: [groupModuleSchedule.trainerId],
    references: [trainers.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTrainerSchema = createInsertSchema(trainers).omit({
  id: true,
  currentHoursPerWeek: true,
  createdAt: true,
});

export const insertModuleSchema = createInsertSchema(modules).omit({
  id: true,
  createdAt: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

export const insertTrainingGroupSchema = createInsertSchema(trainingGroups).omit({
  id: true,
  createdAt: true,
});

export const insertModuleTrainerAssignmentSchema = createInsertSchema(moduleTrainerAssignments).omit({
  id: true,
});

export const insertGroupModuleScheduleSchema = createInsertSchema(groupModuleSchedule).omit({
  id: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Trainer = typeof trainers.$inferSelect;
export type InsertTrainer = z.infer<typeof insertTrainerSchema>;

export type Module = typeof modules.$inferSelect;
export type InsertModule = z.infer<typeof insertModuleSchema>;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type TrainingGroup = typeof trainingGroups.$inferSelect;
export type InsertTrainingGroup = z.infer<typeof insertTrainingGroupSchema>;

export type ModuleTrainerAssignment = typeof moduleTrainerAssignments.$inferSelect;
export type InsertModuleTrainerAssignment = z.infer<typeof insertModuleTrainerAssignmentSchema>;

export type GroupModuleSchedule = typeof groupModuleSchedule.$inferSelect;
export type InsertGroupModuleSchedule = z.infer<typeof insertGroupModuleScheduleSchema>;
