import { pgTable, text, serial, integer, boolean, timestamp, date, varchar, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === ENUMS ===
export const userRoles = ["admin", "pastor", "secretary", "finance", "choir_director", "media_director", "head_usher", "welfare_coordinator", "evangelism_coordinator", "member"] as const;
export const memberStatus = ["active", "inactive", "suspended", "deceased", "moved"] as const;
export const eventTypes = ["service", "rehearsal", "meeting", "outreach", "social"] as const;
export const donationTypes = ["tithe", "offering", "pledge", "project", "welfare", "other"] as const;
export const welfareStatus = ["pending", "approved", "rejected", "disbursed"] as const;
export const evangelismStatus = ["new", "contacted", "visiting", "regular", "member"] as const;

// === USERS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: userRoles }).notNull().default("member"),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === MEMBERS ===
export const members = pgTable("members", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  dateOfBirth: date("date_of_birth"),
  status: text("status", { enum: memberStatus }).default("active"),
  joinedDate: date("joined_date").defaultNow(),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === EVENTS & CALENDAR ===
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: text("location"),
  type: text("type", { enum: eventTypes }).notNull(),
  organizerId: integer("organizer_id"), // User ID
});

// === SERVICES (Worship Services) ===
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  title: text("title").notNull(), // e.g., "Sunday Service", "Midweek Service"
  attendanceCount: integer("attendance_count").default(0),
  offeringAmount: integer("offering_amount").default(0), // In cents
  notes: text("notes"),
});

// === DONATIONS ===
export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id),
  donorName: text("donor_name"), // For non-members
  amount: integer("amount").notNull(), // In cents
  date: date("date").defaultNow(),
  type: text("type", { enum: donationTypes }).notNull(),
  notes: text("notes"),
});

// === MINISTRIES (Choir, Media, Ushers, etc.) ===
export const ministries = pgTable("ministries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'choir', 'media', 'usher', 'small_group'
  description: text("description"),
  leaderId: integer("leader_id").references(() => members.id),
});

export const ministryMembers = pgTable("ministry_members", {
  id: serial("id").primaryKey(),
  ministryId: integer("ministry_id").references(() => ministries.id).notNull(),
  memberId: integer("member_id").references(() => members.id).notNull(),
  role: text("role"), // 'soprano', 'camera_operator', etc.
  joinedDate: date("joined_date").defaultNow(),
});

// === WELFARE ===
export const welfareCases = pgTable("welfare_cases", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id").references(() => members.id),
  beneficiaryName: text("beneficiary_name"), // If not a member
  type: text("type").notNull(), // medical, rent, food...
  description: text("description").notNull(),
  amountRequested: integer("amount_requested"), // cents
  amountApproved: integer("amount_approved"), // cents
  status: text("status", { enum: welfareStatus }).default("pending"),
  date: date("date").defaultNow(),
  notes: text("notes"),
});

// === EVANGELISM ===
export const evangelismRecords = pgTable("evangelism_records", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  status: text("status", { enum: evangelismStatus }).default("new"),
  contactDate: date("contact_date").defaultNow(),
  assignedMemberId: integer("assigned_member_id").references(() => members.id),
  notes: text("notes"),
});

// === SESSION (for connect-pg-simple) ===
export const sessions = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// === RELATIONS ===
export const membersRelations = relations(members, ({ many }) => ({
  donations: many(donations),
  ministryMemberships: many(ministryMembers),
}));

export const donationsRelations = relations(donations, ({ one }) => ({
  member: one(members, {
    fields: [donations.memberId],
    references: [members.id],
  }),
}));

export const ministriesRelations = relations(ministries, ({ one, many }) => ({
  leader: one(members, {
    fields: [ministries.leaderId],
    references: [members.id],
  }),
  members: many(ministryMembers),
}));

export const ministryMembersRelations = relations(ministryMembers, ({ one }) => ({
  ministry: one(ministries, {
    fields: [ministryMembers.ministryId],
    references: [ministries.id],
  }),
  member: one(members, {
    fields: [ministryMembers.memberId],
    references: [members.id],
  }),
}));

// === ZOD SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertMemberSchema = createInsertSchema(members).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export const insertDonationSchema = createInsertSchema(donations).omit({ id: true });
export const insertMinistrySchema = createInsertSchema(ministries).omit({ id: true });
export const insertMinistryMemberSchema = createInsertSchema(ministryMembers).omit({ id: true });
export const insertWelfareCaseSchema = createInsertSchema(welfareCases).omit({ id: true });
export const insertEvangelismRecordSchema = createInsertSchema(evangelismRecords).omit({ id: true });

// === TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type Ministry = typeof ministries.$inferSelect;
export type InsertMinistry = z.infer<typeof insertMinistrySchema>;
export type MinistryMember = typeof ministryMembers.$inferSelect;
export type InsertMinistryMember = z.infer<typeof insertMinistryMemberSchema>;
export type WelfareCase = typeof welfareCases.$inferSelect;
export type InsertWelfareCase = z.infer<typeof insertWelfareCaseSchema>;
export type EvangelismRecord = typeof evangelismRecords.$inferSelect;
export type InsertEvangelismRecord = z.infer<typeof insertEvangelismRecordSchema>;

// Complex types for UI
export type MinistryWithLeader = Ministry & { leader?: Member | null };
export type MinistryMemberWithDetails = MinistryMember & { member: Member };
