/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as comptabilite from "../comptabilite.js";
import type * as escrows from "../escrows.js";
import type * as http from "../http.js";
import type * as lib_auth_helpers from "../lib/auth_helpers.js";
import type * as lib_rates from "../lib/rates.js";
import type * as margin_tiers from "../margin_tiers.js";
import type * as margins from "../margins.js";
import type * as orders from "../orders.js";
import type * as packages from "../packages.js";
import type * as payment_intents from "../payment_intents.js";
import type * as promo_codes from "../promo_codes.js";
import type * as provider_operations from "../provider_operations.js";
import type * as purchases from "../purchases.js";
import type * as rates from "../rates.js";
import type * as sms_countries from "../sms_countries.js";
import type * as sms_provider from "../sms_provider.js";
import type * as tests from "../tests.js";
import type * as users from "../users.js";
import type * as wallet from "../wallet.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  comptabilite: typeof comptabilite;
  escrows: typeof escrows;
  http: typeof http;
  "lib/auth_helpers": typeof lib_auth_helpers;
  "lib/rates": typeof lib_rates;
  margin_tiers: typeof margin_tiers;
  margins: typeof margins;
  orders: typeof orders;
  packages: typeof packages;
  payment_intents: typeof payment_intents;
  promo_codes: typeof promo_codes;
  provider_operations: typeof provider_operations;
  purchases: typeof purchases;
  rates: typeof rates;
  sms_countries: typeof sms_countries;
  sms_provider: typeof sms_provider;
  tests: typeof tests;
  users: typeof users;
  wallet: typeof wallet;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
