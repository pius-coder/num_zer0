/**
 * Fapshi Payment SDK
 *
 * A Node.js SDK for integrating Fapshi payment services.
 * Supports payment links, direct payments, transactions, balance checks, and payouts.
 * 
 * @packageDocumentation
 */

// ─── Types ───

export type {
    FapshiConfig,
    Environment,
    TransactionStatus,
    PaymentMedium,
    PayoutMedium,
    GenerateLinkRequest,
    GenerateLinkResponse,
    DirectPayRequest,
    DirectPayResponse,
    Transaction,
    SearchParams,
    PayoutRequest,
    PayoutResponse,
    BalanceResponse,
    FapshiApiResponse,
} from "./types";

// ─── Errors ───

export {
    FapshiError,
    FAPSHI_ERROR_CODES,
    isFapshiError,
    getErrorMessage,
} from "./errors";

// ─── Client ───

export { FapshiClient } from "./client";

// ─── Factory ───

export { createFapshiClient } from "./factory";

// ─── Webhook ───

export {
    parseWebhookPayload,
    isValidTransaction,
} from "./webhook";
