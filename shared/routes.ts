import { z } from "zod";
import { 
  insertUserSchema, insertMemberSchema, insertEventSchema, insertServiceSchema, 
  insertDonationSchema, insertMinistrySchema, insertMinistryMemberSchema, 
  insertWelfareCaseSchema, insertEvangelismRecordSchema,
  users, members, events, services, donations, ministries, ministryMembers, welfareCases, evangelismRecords
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// Generic list query params
const listQueryParams = z.object({
  search: z.string().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
});

export const api = {
  // Auth
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },

  // Members
  members: {
    list: {
      method: 'GET' as const,
      path: '/api/members',
      input: listQueryParams,
      responses: {
        200: z.array(z.custom<typeof members.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/members/:id',
      responses: {
        200: z.custom<typeof members.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/members',
      input: insertMemberSchema,
      responses: {
        201: z.custom<typeof members.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/members/:id',
      input: insertMemberSchema.partial(),
      responses: {
        200: z.custom<typeof members.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/members/:id',
      responses: {
        200: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },

  // Events
  events: {
    list: {
      method: 'GET' as const,
      path: '/api/events',
      input: listQueryParams.extend({ start: z.string().optional(), end: z.string().optional() }),
      responses: {
        200: z.array(z.custom<typeof events.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events',
      input: insertEventSchema,
      responses: {
        201: z.custom<typeof events.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/events/:id',
      input: insertEventSchema.partial(),
      responses: {
        200: z.custom<typeof events.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/events/:id',
      responses: {
        200: z.void(),
      },
    },
  },

  // Services
  services: {
    list: {
      method: 'GET' as const,
      path: '/api/services',
      input: listQueryParams,
      responses: {
        200: z.array(z.custom<typeof services.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/services',
      input: insertServiceSchema,
      responses: {
        201: z.custom<typeof services.$inferSelect>(),
      },
    },
  },

  // Donations
  donations: {
    list: {
      method: 'GET' as const,
      path: '/api/donations',
      input: listQueryParams,
      responses: {
        200: z.array(z.custom<typeof donations.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/donations',
      input: insertDonationSchema,
      responses: {
        201: z.custom<typeof donations.$inferSelect>(),
      },
    },
  },

  // Ministries
  ministries: {
    list: {
      method: 'GET' as const,
      path: '/api/ministries',
      input: listQueryParams,
      responses: {
        200: z.array(z.custom<typeof ministries.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/ministries/:id',
      responses: {
        200: z.custom<typeof ministries.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/ministries',
      input: insertMinistrySchema,
      responses: {
        201: z.custom<typeof ministries.$inferSelect>(),
      },
    },
    members: {
      list: {
        method: 'GET' as const,
        path: '/api/ministries/:id/members',
        responses: {
          200: z.array(z.custom<typeof ministryMembers.$inferSelect & { member: typeof members.$inferSelect }>()),
        },
      },
      add: {
        method: 'POST' as const,
        path: '/api/ministries/:id/members',
        input: insertMinistryMemberSchema.omit({ ministryId: true }),
        responses: {
          201: z.custom<typeof ministryMembers.$inferSelect>(),
        },
      },
    },
  },

  // Welfare
  welfare: {
    list: {
      method: 'GET' as const,
      path: '/api/welfare',
      input: listQueryParams,
      responses: {
        200: z.array(z.custom<typeof welfareCases.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/welfare',
      input: insertWelfareCaseSchema,
      responses: {
        201: z.custom<typeof welfareCases.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/welfare/:id',
      input: insertWelfareCaseSchema.partial(),
      responses: {
        200: z.custom<typeof welfareCases.$inferSelect>(),
      },
    },
  },

  // Evangelism
  evangelism: {
    list: {
      method: 'GET' as const,
      path: '/api/evangelism',
      input: listQueryParams,
      responses: {
        200: z.array(z.custom<typeof evangelismRecords.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/evangelism',
      input: insertEvangelismRecordSchema,
      responses: {
        201: z.custom<typeof evangelismRecords.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/evangelism/:id',
      input: insertEvangelismRecordSchema.partial(),
      responses: {
        200: z.custom<typeof evangelismRecords.$inferSelect>(),
      },
    },
  },

  // Dashboard Stats
  dashboard: {
    stats: {
      method: 'GET' as const,
      path: '/api/stats',
      responses: {
        200: z.object({
          memberCount: z.number(),
          attendanceTrend: z.number(), // Percentage
          donationsThisMonth: z.number(), // cents
          upcomingEvents: z.number(),
          newConverts: z.number(),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}

export type InsertUser = z.infer<typeof api.auth.register.input>;
export type InsertMember = z.infer<typeof api.members.create.input>;
export type InsertEvent = z.infer<typeof api.events.create.input>;
export type InsertService = z.infer<typeof api.services.create.input>;
export type InsertDonation = z.infer<typeof api.donations.create.input>;
export type InsertWelfareCase = z.infer<typeof api.welfare.create.input>;
export type InsertMinistry = z.infer<typeof api.ministries.create.input>;
export type InsertMinistryMember = z.infer<typeof api.ministries.members.add.input>;
export type InsertEvangelismRecord = z.infer<typeof api.evangelism.create.input>;
