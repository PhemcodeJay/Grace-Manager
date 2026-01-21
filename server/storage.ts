import { 
  users, members, events, services, donations, ministries, ministryMembers, welfareCases, evangelismRecords,
  type User, type InsertUser, type Member, type InsertMember, type Event, type InsertEvent,
  type Service, type InsertService, type Donation, type InsertDonation,
  type Ministry, type InsertMinistry, type MinistryMember, type InsertMinistryMember,
  type WelfareCase, type InsertWelfareCase, type EvangelismRecord, type InsertEvangelismRecord
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, ilike } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Auth & Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  sessionStore: session.Store;

  // Members
  getMembers(params?: { search?: string, status?: string }): Promise<Member[]>;
  getMember(id: number): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: number, member: Partial<InsertMember>): Promise<Member>;
  deleteMember(id: number): Promise<void>;

  // Events
  getEvents(params?: { start?: Date, end?: Date }): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event>;
  deleteEvent(id: number): Promise<void>;

  // Services
  getServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;

  // Donations
  getDonations(): Promise<Donation[]>;
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonationsTotal(period: 'month' | 'year'): Promise<number>;

  // Ministries
  getMinistries(): Promise<Ministry[]>;
  getMinistry(id: number): Promise<Ministry | undefined>;
  createMinistry(ministry: InsertMinistry): Promise<Ministry>;
  getMinistryMembers(ministryId: number): Promise<(MinistryMember & { member: Member })[]>;
  addMinistryMember(data: InsertMinistryMember): Promise<MinistryMember>;

  // Welfare
  getWelfareCases(): Promise<WelfareCase[]>;
  createWelfareCase(data: InsertWelfareCase): Promise<WelfareCase>;
  updateWelfareCase(id: number, data: Partial<InsertWelfareCase>): Promise<WelfareCase>;

  // Evangelism
  getEvangelismRecords(): Promise<EvangelismRecord[]>;
  createEvangelismRecord(data: InsertEvangelismRecord): Promise<EvangelismRecord>;
  updateEvangelismRecord(id: number, data: Partial<InsertEvangelismRecord>): Promise<EvangelismRecord>;

  // Stats
  getDashboardStats(): Promise<{
    memberCount: number;
    attendanceTrend: number;
    donationsThisMonth: number;
    upcomingEvents: number;
    newConverts: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // Auth
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Members
  async getMembers(params?: { search?: string, status?: string }): Promise<Member[]> {
    let query = db.select().from(members);
    const conditions = [];
    
    if (params?.search) {
      conditions.push(
        sql`(${members.firstName} || ' ' || ${members.lastName}) ILIKE ${`%${params.search}%`}`
      );
    }
    
    if (params?.status) {
      conditions.push(eq(members.status, params.status as any));
    }
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(members.createdAt));
  }

  async getMember(id: number): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member;
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const [member] = await db.insert(members).values(insertMember).returning();
    return member;
  }

  async updateMember(id: number, update: Partial<InsertMember>): Promise<Member> {
    const [member] = await db.update(members).set(update).where(eq(members.id, id)).returning();
    return member;
  }

  async deleteMember(id: number): Promise<void> {
    await db.delete(members).where(eq(members.id, id));
  }

  // Events
  async getEvents(params?: { start?: Date, end?: Date }): Promise<Event[]> {
    return await db.select().from(events).orderBy(events.startTime);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(insertEvent).returning();
    return event;
  }

  async updateEvent(id: number, update: Partial<InsertEvent>): Promise<Event> {
    const [event] = await db.update(events).set(update).where(eq(events.id, id)).returning();
    return event;
  }

  async deleteEvent(id: number): Promise<void> {
    await db.delete(events).where(eq(events.id, id));
  }

  // Services
  async getServices(): Promise<Service[]> {
    return await db.select().from(services).orderBy(desc(services.date));
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(insertService).returning();
    return service;
  }

  // Donations
  async getDonations(): Promise<Donation[]> {
    return await db.select().from(donations).orderBy(desc(donations.date));
  }

  async createDonation(insertDonation: InsertDonation): Promise<Donation> {
    const [donation] = await db.insert(donations).values(insertDonation).returning();
    return donation;
  }

  async getDonationsTotal(period: 'month' | 'year'): Promise<number> {
    // Simplified for now - usually needs more complex date filtering
    const result = await db.select({ 
      total: sql<number>`sum(${donations.amount})` 
    }).from(donations);
    return result[0]?.total || 0;
  }

  // Ministries
  async getMinistries(): Promise<Ministry[]> {
    return await db.select().from(ministries);
  }

  async getMinistry(id: number): Promise<Ministry | undefined> {
    const [ministry] = await db.select().from(ministries).where(eq(ministries.id, id));
    return ministry;
  }

  async createMinistry(insertMinistry: InsertMinistry): Promise<Ministry> {
    const [ministry] = await db.insert(ministries).values(insertMinistry).returning();
    return ministry;
  }

  async getMinistryMembers(ministryId: number): Promise<(MinistryMember & { member: Member })[]> {
    return await db.select({
      id: ministryMembers.id,
      ministryId: ministryMembers.ministryId,
      memberId: ministryMembers.memberId,
      role: ministryMembers.role,
      joinedDate: ministryMembers.joinedDate,
      member: members
    })
    .from(ministryMembers)
    .innerJoin(members, eq(ministryMembers.memberId, members.id))
    .where(eq(ministryMembers.ministryId, ministryId));
  }

  async addMinistryMember(data: InsertMinistryMember): Promise<MinistryMember> {
    const [mm] = await db.insert(ministryMembers).values(data).returning();
    return mm;
  }

  // Welfare
  async getWelfareCases(): Promise<WelfareCase[]> {
    return await db.select().from(welfareCases).orderBy(desc(welfareCases.date));
  }

  async createWelfareCase(data: InsertWelfareCase): Promise<WelfareCase> {
    const [wc] = await db.insert(welfareCases).values(data).returning();
    return wc;
  }

  async updateWelfareCase(id: number, data: Partial<InsertWelfareCase>): Promise<WelfareCase> {
    const [wc] = await db.update(welfareCases).set(data).where(eq(welfareCases.id, id)).returning();
    return wc;
  }

  // Evangelism
  async getEvangelismRecords(): Promise<EvangelismRecord[]> {
    return await db.select().from(evangelismRecords).orderBy(desc(evangelismRecords.contactDate));
  }

  async createEvangelismRecord(data: InsertEvangelismRecord): Promise<EvangelismRecord> {
    const [er] = await db.insert(evangelismRecords).values(data).returning();
    return er;
  }

  async updateEvangelismRecord(id: number, data: Partial<InsertEvangelismRecord>): Promise<EvangelismRecord> {
    const [er] = await db.update(evangelismRecords).set(data).where(eq(evangelismRecords.id, id)).returning();
    return er;
  }

  // Stats
  async getDashboardStats() {
    const [memberCount] = await db.select({ count: sql<number>`count(*)` }).from(members);
    const [newConverts] = await db.select({ count: sql<number>`count(*)` }).from(evangelismRecords).where(eq(evangelismRecords.status, 'new'));
    const [upcomingEvents] = await db.select({ count: sql<number>`count(*)` }).from(events).where(sql`${events.startTime} > NOW()`);
    
    // Simple sum of donations this month
    const [donationsThisMonth] = await db.select({ sum: sql<number>`sum(${donations.amount})` })
      .from(donations)
      .where(sql`EXTRACT(MONTH FROM ${donations.date}) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM ${donations.date}) = EXTRACT(YEAR FROM CURRENT_DATE)`);

    return {
      memberCount: Number(memberCount?.count || 0),
      attendanceTrend: 5, // Mock trend for now
      donationsThisMonth: Number(donationsThisMonth?.sum || 0),
      upcomingEvents: Number(upcomingEvents?.count || 0),
      newConverts: Number(newConverts?.count || 0),
    };
  }
}

export const storage = new DatabaseStorage();
