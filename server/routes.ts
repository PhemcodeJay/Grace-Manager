import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { users } from "@shared/schema";
import { desc } from "drizzle-orm";
import { api } from "@shared/routes";
import { z } from "zod";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === AUTH SETUP ===
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set");
  }

  app.use(
    session({
      store: storage.sessionStore,
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false, { message: "Invalid username" });
        
        const isValid = await comparePasswords(password, user.password);
        if (!isValid) return done(null, false, { message: "Invalid password" });
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth Middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  // === ROUTES ===

  // Auth Routes
  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    res.json(req.user);
  });

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const existing = await storage.getUserByUsername(req.body.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const input = api.auth.register.input.parse(req.body);
      const hashedPassword = await hashPassword(input.password);
      
      const user = await storage.createUser({
        ...input,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) throw err;
        res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Members
  app.get(api.members.list.path, requireAuth, async (req, res) => {
    const members = await storage.getMembers({
      search: req.query.search as string,
      status: req.query.status as string,
    });
    res.json(members);
  });

  app.post(api.members.create.path, requireAuth, async (req, res) => {
    try {
      const input = api.members.create.input.parse(req.body);
      const member = await storage.createMember(input);
      res.status(201).json(member);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      throw err;
    }
  });

  app.get(api.members.get.path, requireAuth, async (req, res) => {
    const member = await storage.getMember(Number(req.params.id));
    if (!member) return res.status(404).json({ message: "Member not found" });
    res.json(member);
  });

  app.patch(api.members.update.path, requireAuth, async (req, res) => {
    const member = await storage.updateMember(Number(req.params.id), req.body);
    res.json(member);
  });

  app.delete(api.members.delete.path, requireAuth, async (req, res) => {
    await storage.deleteMember(Number(req.params.id));
    res.sendStatus(200);
  });

  // Events
  app.get(api.events.list.path, requireAuth, async (req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.post(api.events.create.path, requireAuth, async (req, res) => {
    const input = api.events.create.input.parse(req.body);
    const event = await storage.createEvent(input);
    res.status(201).json(event);
  });

  app.patch(api.events.update.path, requireAuth, async (req, res) => {
    const event = await storage.updateEvent(Number(req.params.id), req.body);
    res.json(event);
  });

  app.delete(api.events.delete.path, requireAuth, async (req, res) => {
    await storage.deleteEvent(Number(req.params.id));
    res.sendStatus(200);
  });

  // Services
  app.get(api.services.list.path, requireAuth, async (req, res) => {
    const services = await storage.getServices();
    res.json(services);
  });

  app.post(api.services.create.path, requireAuth, async (req, res) => {
    const input = api.services.create.input.parse(req.body);
    const service = await storage.createService(input);
    res.status(201).json(service);
  });

  // Donations
  app.get(api.donations.list.path, requireAuth, async (req, res) => {
    const donations = await storage.getDonations();
    res.json(donations);
  });

  app.post(api.donations.create.path, requireAuth, async (req, res) => {
    const input = api.donations.create.input.parse(req.body);
    const donation = await storage.createDonation(input);
    res.status(201).json(donation);
  });

  // Ministries
  app.get(api.ministries.list.path, requireAuth, async (req, res) => {
    const ministries = await storage.getMinistries();
    res.json(ministries);
  });

  app.post(api.ministries.create.path, requireAuth, async (req, res) => {
    const input = api.ministries.create.input.parse(req.body);
    const ministry = await storage.createMinistry(input);
    res.status(201).json(ministry);
  });

  app.get(api.ministries.get.path, requireAuth, async (req, res) => {
    const ministry = await storage.getMinistry(Number(req.params.id));
    if (!ministry) return res.status(404).json({ message: "Ministry not found" });
    res.json(ministry);
  });

  app.get(api.ministries.members.list.path, requireAuth, async (req, res) => {
    const members = await storage.getMinistryMembers(Number(req.params.id));
    res.json(members);
  });

  app.post(api.ministries.members.add.path, requireAuth, async (req, res) => {
    const input = api.ministries.members.add.input.parse(req.body);
    const mm = await storage.addMinistryMember({ ...input, ministryId: Number(req.params.id) });
    res.status(201).json(mm);
  });

  // Welfare
  app.get(api.welfare.list.path, requireAuth, async (req, res) => {
    const cases = await storage.getWelfareCases();
    res.json(cases);
  });

  app.post(api.welfare.create.path, requireAuth, async (req, res) => {
    const input = api.welfare.create.input.parse(req.body);
    const wc = await storage.createWelfareCase(input);
    res.status(201).json(wc);
  });

  // Evangelism
  app.get(api.evangelism.list.path, requireAuth, async (req, res) => {
    const records = await storage.getEvangelismRecords();
    res.json(records);
  });

  app.post(api.evangelism.create.path, requireAuth, async (req, res) => {
    const input = api.evangelism.create.input.parse(req.body);
    const er = await storage.createEvangelismRecord(input);
    res.status(201).json(er);
  });

  // Stats
  app.get(api.dashboard.stats.path, requireAuth, async (req, res) => {
    const stats = await storage.getDashboardStats();
    res.json(stats);
  });

  // Admin User Management
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    if ((req.user as any).role !== "admin") {
      return res.status(403).json({ message: "Only administrators can manage users" });
    }
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    res.json(allUsers);
  });

  app.post("/api/admin/users", requireAuth, async (req, res) => {
    if ((req.user as any).role !== "admin") {
      return res.status(403).json({ message: "Only administrators can manage users" });
    }
    
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(input.password);
      const user = await storage.createUser({
        ...input,
        password: hashedPassword,
      });
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // === SEED DATA ===
  await seedData();

  return httpServer;
}

async function seedData() {
  const existingUser = await storage.getUserByUsername("admin");
  if (!existingUser) {
    console.log("Seeding data...");
    
    // Create Admin
    const hashedPassword = await hashPassword("admin1234");
    await storage.createUser({
      username: "admin",
      password: hashedPassword,
      name: "System Admin",
      role: "admin",
    });

    // Create Choir Leader
    const member1 = await storage.createMember({
      firstName: "John",
      lastName: "Doe",
      email: "john@church.com",
      status: "active",
      joinedDate: new Date().toISOString(),
    });

    const member2 = await storage.createMember({
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@church.com",
      status: "active",
      joinedDate: new Date().toISOString(),
    });

    // Create Ministry
    const choir = await storage.createMinistry({
      name: "Main Choir",
      type: "choir",
      description: "The main sunday service choir",
      leaderId: member1.id,
    });

    await storage.createMinistry({
      name: "Media Team",
      type: "media",
      description: "Sound, lights, and video streaming",
      leaderId: member2.id,
    });

    await storage.createMinistry({
      name: "Usher Board",
      type: "usher",
      description: "Order and hospitality in the sanctuary",
      leaderId: member1.id,
    });

    // Seed Welfare
    await storage.createWelfareCase({
      memberId: member1.id,
      type: "medical",
      description: "Medical assistance for surgery",
      amountRequested: 50000,
      status: "pending",
      date: new Date().toISOString(),
    });

    // Seed Evangelism
    await storage.createEvangelismRecord({
      firstName: "James",
      lastName: "Visitor",
      phone: "555-0199",
      status: "new",
      contactDate: new Date().toISOString(),
      assignedMemberId: member2.id,
    });

    // Create Event
    await storage.createEvent({
      title: "Sunday Service",
      description: "Regular weekly service",
      startTime: new Date("2026-01-11T09:00:00Z"),
      endTime: new Date("2026-01-11T12:00:00Z"),
      type: "service",
      location: "Main Sanctuary",
    });

    console.log("Seeding complete.");
  }
}
