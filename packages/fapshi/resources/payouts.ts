/**
 * Fapshi Payment SDK - Payouts Resource
 *
 * Handles payout operations.
 */

import type { Result } from "@/packages/result";
import { FapshiError, createValidationError } from "../errors";
import {
    validateAmount,
    validatePhone,
    validateUserId,
    validateExternalId,
    validateMedium,
} from "../utils";
import type { PayoutRequest, PayoutResponse } from "../types";

/**
 * API endpoints for payouts
 */
const ENDPOINTS = {
    PAYOUT: "/payout",
} as const;

/**
 * PayoutsResource - Handles payout operations
 */
export class PayoutsResource {
    constructor(private client: import("../client").FapshiClient) {}

    /**
     * Send a payout
     *
     * @param params - Payout parameters
     * @returns Result containing transaction ID
     */
    async send(
        params: PayoutRequest,
    ): Promise<Result<PayoutResponse, FapshiError>> {
        // Validate amount
        try {
            validateAmount(params.amount);

            // Validate medium if provided
            if (params.medium) {
                validateMedium(params.medium, [
                    "mobile money",
                    "orange money",
                    "fapshi",
                ]);
            }

            // Conditional validation based on medium
            if (params.medium === "fapshi") {
                // Email is required for fapshi medium
                if (!params.email) {
                    throw createValidationError(
                        "Email is required for fapshi medium",
                        {
                            email: [
                                "Email is required when using fapshi medium",
                            ],
                        },
                    );
                }
            } else if (
                params.medium === "mobile money" ||
                params.medium === "orange money"
            ) {
                // Phone is required for mobile money mediums
                if (!params.phone) {
                    throw createValidationError(
                        "Phone is required for " + params.medium + " medium",
                        {
                            phone: [
                                "Phone is required when using " + params.medium,
                            ],
                        },
                    );
                }
                validatePhone(params.phone);
            } else if (!params.medium) {
                // No medium specified, phone is required by default
                if (!params.phone) {
                    throw createValidationError(
                        "Phone is required when medium is not specified",
                        {
                            phone: [
                                "Phone is required when medium is not specified",
                            ],
                        },
                    );
                }
                validatePhone(params.phone);
            }

            // Validate optional fields
            if (params.userId) validateUserId(params.userId);
            if (params.externalId) validateExternalId(params.externalId);
        } catch (error) {
            if (error instanceof FapshiError) {
                return { ok: false, error } as Result<
                    PayoutResponse,
                    FapshiError
                >;
            }
            throw error;
        }

        // Make API request
        const result = await this.client.request<PayoutResponse>({
            method: "POST",
            path: ENDPOINTS.PAYOUT,
            body: {
                amount: params.amount,
                phone: params.phone,
                medium: params.medium,
                name: params.name,
                email: params.email,
                userId: params.userId,
                externalId: params.externalId,
                message: params.message,
            },
        });

        return result;
    }
}
