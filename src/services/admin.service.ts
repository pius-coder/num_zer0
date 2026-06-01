import { asc, desc, eq, count, ilike, or, sql, sum, and } from "drizzle-orm";

import { BaseService } from "./base.service";
import {
  user,
  smsActivation,
  creditPurchase,
  fraudEvent,
  adminAuditLog,
  creditPackage,
  priceRule,
  provider,
  creditWallet,
} from "@/database/schema";

export interface AdminUserListItem {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  banned: boolean;
}

export interface AdminUserDetail {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  banned: boolean;
  wallet: {
    baseBalance: number;
    bonusBalance: number;
    promoBalance: number;
    totalPurchased: number;
    totalConsumed: number;
    totalRefunded: number;
    totalExpired: number;
    heldBalance: number;
  } | null;
  stats: {
    purchases: { total: number; totalSpentXaf: number };
    activations: { total: number; completed: number };
    fraud: { total: number; unresolved: number };
  };
}

export interface AdminActivationListItem {
  id: string;
  userId: string;
  userEmail: string | null;
  serviceSlug: string;
  countryCode: string;
  phoneNumber: string | null;
  state: string;
  creditsCharged: number;
  createdAt: Date;
  completedAt: Date | null;
}

export interface AdminPurchaseListItem {
  id: string;
  userId: string;
  userEmail: string | null;
  packageId: string;
  creditsBase: number;
  creditsBonus: number;
  totalCredits: number;
  priceXaf: number;
  paymentMethod: string;
  status: string;
  paymentRef: string | null;
  createdAt: Date;
  creditedAt: Date | null;
  failedAt: Date | null;
}

export interface AdminFraudEventItem {
  id: string;
  userId: string;
  userEmail: string | null;
  signalType: string;
  signals: unknown;
  decision: string;
  isResolved: boolean;
  resolvedAt: Date | null;
  resolutionNote: string | null;
  createdAt: Date;
}

export interface AdminAuditLogItem {
  id: string;
  adminId: string;
  adminEmail: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  ipAddress: string | null;
  createdAt: Date;
}

export interface AdminCreditPackageItem {
  id: string;
  slug: string;
  nameFr: string;
  nameEn: string;
  credits: number;
  priceXaf: number;
  bonusPct: number;
  label: string | null;
  sortOrder: number;
  isActive: boolean;
}

/**
 * Builds a WHERE clause from optional filters.
 * Returns undefined if no filters — Drizzle treats undefined as "no WHERE".
 */
function buildWhere(
  conditions: (
    | ReturnType<typeof eq>
    | ReturnType<typeof ilike>
    | ReturnType<typeof or>
    | undefined
  )[],
):
  | ReturnType<typeof eq>
  | ReturnType<typeof ilike>
  | ReturnType<typeof or>
  | undefined {
  const valid = conditions.filter(Boolean);
  if (valid.length === 0) return undefined;
  if (valid.length === 1) return valid[0];
  return and(...valid);
}

export class AdminService extends BaseService {
  constructor() {
    super({ prefix: "admin-service", db: true });
  }

  async listUsers(params: { page: number; limit: number; search?: string }) {
    const offset = (params.page - 1) * params.limit;

    const whereClause =
      params.search && params.search.length > 0
        ? or(
            ilike(user.name, `%${params.search}%`),
            ilike(user.email, `%${params.search}%`),
          )
        : undefined;

    const [rows, [totalRow]] = await Promise.all([
      this.db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          createdAt: user.createdAt,
          banned: user.banned,
        })
        .from(user)
        .where(whereClause)
        .orderBy(desc(user.createdAt))
        .limit(params.limit)
        .offset(offset),
      this.db.select({ total: count() }).from(user).where(whereClause),
    ]);

    return {
      data: rows,
      total: totalRow?.total ?? 0,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil((totalRow?.total ?? 0) / params.limit),
    };
  }

  async getUserDetail(userId: string) {
    const [userRow] = await this.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        banned: user.banned,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    this.assert(!!userRow, "user_not_found", "User not found", { userId });

    const [wallet, purchaseStats, activationStats, fraudStats] =
      await Promise.all([
        this.db
          .select({
            baseBalance: creditWallet.baseBalance,
            bonusBalance: creditWallet.bonusBalance,
            promoBalance: creditWallet.promoBalance,
            totalPurchased: creditWallet.totalPurchased,
            totalConsumed: creditWallet.totalConsumed,
            totalRefunded: creditWallet.totalRefunded,
            totalExpired: creditWallet.totalExpired,
            heldBalance: creditWallet.heldBalance,
          })
          .from(creditWallet)
          .where(eq(creditWallet.userId, userId))
          .limit(1),

        this.db
          .select({
            totalPurchases: count(),
            totalSpentXaf: sum(creditPurchase.priceXaf),
          })
          .from(creditPurchase)
          .where(eq(creditPurchase.userId, userId)),

        this.db
          .select({
            totalActivations: count(),
            completedActivations: count(
              sql`CASE WHEN ${smsActivation.state} = 'completed' THEN 1 END`,
            ),
          })
          .from(smsActivation)
          .where(eq(smsActivation.userId, userId)),

        this.db
          .select({
            totalFraudEvents: count(),
            unresolvedFraudEvents: count(
              sql`CASE WHEN NOT ${fraudEvent.isResolved} THEN 1 END`,
            ),
          })
          .from(fraudEvent)
          .where(eq(fraudEvent.userId, userId)),
      ]);

    return {
      user: userRow,
      wallet: wallet[0] ?? null,
      stats: {
        purchases: {
          total: purchaseStats[0]?.totalPurchases ?? 0,
          totalSpentXaf: Number(purchaseStats[0]?.totalSpentXaf ?? 0),
        },
        activations: {
          total: activationStats[0]?.totalActivations ?? 0,
          completed: Number(activationStats[0]?.completedActivations ?? 0),
        },
        fraud: {
          total: fraudStats[0]?.totalFraudEvents ?? 0,
          unresolved: Number(fraudStats[0]?.unresolvedFraudEvents ?? 0),
        },
      },
    };
  }

  async listActivations(params: {
    page: number;
    limit: number;
    userId?: string;
    status?: string;
  }) {
    const offset = (params.page - 1) * params.limit;

    const whereClause = buildWhere([
      params.userId ? eq(smsActivation.userId, params.userId) : undefined,
      params.status
        ? eq(
            smsActivation.state,
            params.status as (typeof smsActivation.state.enumValues)[number],
          )
        : undefined,
    ]);

    const [rows, [totalRow]] = await Promise.all([
      this.db
        .select({
          id: smsActivation.id,
          userId: smsActivation.userId,
          userEmail: user.email,
          serviceSlug: smsActivation.serviceSlug,
          countryCode: smsActivation.countryCode,
          phoneNumber: smsActivation.phoneNumber,
          state: smsActivation.state,
          creditsCharged: smsActivation.creditsCharged,
          createdAt: smsActivation.createdAt,
          completedAt: smsActivation.completedAt,
        })
        .from(smsActivation)
        .leftJoin(user, eq(smsActivation.userId, user.id))
        .where(whereClause)
        .orderBy(desc(smsActivation.createdAt))
        .limit(params.limit)
        .offset(offset),
      this.db.select({ total: count() }).from(smsActivation).where(whereClause),
    ]);

    return {
      data: rows,
      total: totalRow?.total ?? 0,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil((totalRow?.total ?? 0) / params.limit),
    };
  }

  async listPurchases(params: {
    page: number;
    limit: number;
    userId?: string;
    status?: string;
  }) {
    const offset = (params.page - 1) * params.limit;

    const whereClause = buildWhere([
      params.userId ? eq(creditPurchase.userId, params.userId) : undefined,
      params.status
        ? eq(
            creditPurchase.status,
            params.status as (typeof creditPurchase.status.enumValues)[number],
          )
        : undefined,
    ]);

    const [rows, [totalRow]] = await Promise.all([
      this.db
        .select({
          id: creditPurchase.id,
          userId: creditPurchase.userId,
          userEmail: user.email,
          packageId: creditPurchase.packageId,
          creditsBase: creditPurchase.creditsBase,
          creditsBonus: creditPurchase.creditsBonus,
          totalCredits: creditPurchase.totalCredits,
          priceXaf: creditPurchase.priceXaf,
          paymentMethod: creditPurchase.paymentMethod,
          status: creditPurchase.status,
          paymentRef: creditPurchase.paymentRef,
          createdAt: creditPurchase.createdAt,
          creditedAt: creditPurchase.creditedAt,
          failedAt: creditPurchase.failedAt,
        })
        .from(creditPurchase)
        .leftJoin(user, eq(creditPurchase.userId, user.id))
        .where(whereClause)
        .orderBy(desc(creditPurchase.createdAt))
        .limit(params.limit)
        .offset(offset),
      this.db
        .select({ total: count() })
        .from(creditPurchase)
        .where(whereClause),
    ]);

    return {
      data: rows,
      total: totalRow?.total ?? 0,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil((totalRow?.total ?? 0) / params.limit),
    };
  }

  async listFraudEvents(params: {
    page: number;
    limit: number;
    userId?: string;
    resolved?: boolean;
  }) {
    const offset = (params.page - 1) * params.limit;

    const whereClause = buildWhere([
      params.userId ? eq(fraudEvent.userId, params.userId) : undefined,
      params.resolved !== undefined
        ? eq(fraudEvent.isResolved, params.resolved)
        : undefined,
    ]);

    const [rows, [totalRow]] = await Promise.all([
      this.db
        .select({
          id: fraudEvent.id,
          userId: fraudEvent.userId,
          userEmail: user.email,
          signalType: fraudEvent.signalType,
          signals: fraudEvent.signals,
          decision: fraudEvent.decision,
          isResolved: fraudEvent.isResolved,
          resolvedAt: fraudEvent.resolvedAt,
          resolutionNote: fraudEvent.resolutionNote,
          createdAt: fraudEvent.createdAt,
        })
        .from(fraudEvent)
        .leftJoin(user, eq(fraudEvent.userId, user.id))
        .where(whereClause)
        .orderBy(desc(fraudEvent.createdAt))
        .limit(params.limit)
        .offset(offset),
      this.db.select({ total: count() }).from(fraudEvent).where(whereClause),
    ]);

    return {
      data: rows,
      total: totalRow?.total ?? 0,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil((totalRow?.total ?? 0) / params.limit),
    };
  }

  async listAuditLogs(params: {
    page: number;
    limit: number;
    adminId?: string;
    action?: string;
  }) {
    const offset = (params.page - 1) * params.limit;

    const whereClause = buildWhere([
      params.adminId ? eq(adminAuditLog.adminId, params.adminId) : undefined,
      params.action ? eq(adminAuditLog.action, params.action) : undefined,
    ]);

    const [rows, [totalRow]] = await Promise.all([
      this.db
        .select({
          id: adminAuditLog.id,
          adminId: adminAuditLog.adminId,
          adminEmail: user.email,
          action: adminAuditLog.action,
          targetType: adminAuditLog.targetType,
          targetId: adminAuditLog.targetId,
          ipAddress: adminAuditLog.ipAddress,
          createdAt: adminAuditLog.createdAt,
        })
        .from(adminAuditLog)
        .leftJoin(user, eq(adminAuditLog.adminId, user.id))
        .where(whereClause)
        .orderBy(desc(adminAuditLog.createdAt))
        .limit(params.limit)
        .offset(offset),
      this.db.select({ total: count() }).from(adminAuditLog).where(whereClause),
    ]);

    return {
      data: rows,
      total: totalRow?.total ?? 0,
      page: params.page,
      limit: params.limit,
      totalPages: Math.ceil((totalRow?.total ?? 0) / params.limit),
    };
  }

  async listCreditPackages() {
    const packages = await this.db
      .select({
        id: creditPackage.id,
        slug: creditPackage.slug,
        nameFr: creditPackage.nameFr,
        nameEn: creditPackage.nameEn,
        credits: creditPackage.credits,
        priceXaf: creditPackage.priceXaf,
        bonusPct: creditPackage.bonusPct,
        label: creditPackage.label,
        sortOrder: creditPackage.sortOrder,
        isActive: creditPackage.isActive,
      })
      .from(creditPackage)
      .orderBy(asc(creditPackage.sortOrder));

    return { data: packages };
  }

  async updatePriceRule(
    id: string,
    data: { priceCredits?: number; isActive?: boolean },
  ) {
    const existing = await this.db.query.priceRule.findFirst({
      where: eq(priceRule.id, id),
    });
    this.assert(!!existing, "price_rule_not_found", "Price rule not found", {
      id,
    });

    const updates: Partial<typeof priceRule.$inferInsert> & {
      updatedAt: Date;
    } = { updatedAt: new Date() };
    if (data.priceCredits !== undefined)
      updates.priceCredits = data.priceCredits;
    if (data.isActive !== undefined) updates.isActive = data.isActive;

    await this.db.update(priceRule).set(updates).where(eq(priceRule.id, id));

    return this.db.query.priceRule.findFirst({ where: eq(priceRule.id, id) });
  }

  async listProviders() {
    const providers = await this.db
      .select({
        id: provider.id,
        code: provider.code,
        name: provider.name,
        isActive: provider.isActive,
        currentBalanceUsd: provider.currentBalanceUsd,
        balanceLastCheckedAt: provider.balanceLastCheckedAt,
        successRate30d: provider.successRate30d,
        errorRate30d: provider.errorRate30d,
        uptimePct30d: provider.uptimePct30d,
        priority: provider.priority,
      })
      .from(provider)
      .orderBy(asc(provider.priority));

    return { data: providers };
  }
}
