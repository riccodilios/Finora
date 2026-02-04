/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as billing from "../billing.js";
import type * as compliance from "../compliance.js";
import type * as crons from "../crons.js";
import type * as functions from "../functions.js";
import type * as lib_ai_compliance from "../lib/ai_compliance.js";
import type * as lib_audit from "../lib/audit.js";
import type * as lib_consent from "../lib/consent.js";
import type * as lib_data_classification from "../lib/data_classification.js";
import type * as lib_encryption from "../lib/encryption.js";
import type * as lib_log_masking from "../lib/log_masking.js";
import type * as lib_rbac from "../lib/rbac.js";
import type * as migrate_encryption from "../migrate_encryption.js";
import type * as news from "../news.js";
import type * as test_encryption from "../test_encryption.js";
import type * as verify_encryption from "../verify_encryption.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  billing: typeof billing;
  compliance: typeof compliance;
  crons: typeof crons;
  functions: typeof functions;
  "lib/ai_compliance": typeof lib_ai_compliance;
  "lib/audit": typeof lib_audit;
  "lib/consent": typeof lib_consent;
  "lib/data_classification": typeof lib_data_classification;
  "lib/encryption": typeof lib_encryption;
  "lib/log_masking": typeof lib_log_masking;
  "lib/rbac": typeof lib_rbac;
  migrate_encryption: typeof migrate_encryption;
  news: typeof news;
  test_encryption: typeof test_encryption;
  verify_encryption: typeof verify_encryption;
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

export declare const components: {};
