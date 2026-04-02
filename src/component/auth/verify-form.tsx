"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/component/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/component/ui/input-otp";
import { cn } from "@/common/css";
import { emailToPhone } from "@/common/auth/phone-utils";
import { useVerification } from "@/hooks/use-verification";

function VerificationForm({ isProduction }: { isProduction: boolean }) {
  const {
    otp,
    email,
    isLoading,
    isVerified,
    isInvalidOtp,
    errorMessage,
    isOtpComplete,
    verifyCode,
    resendCode,
    handleOtpChange,
  } = useVerification({ isProduction });

  const [countdown, setCountdown] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (countdown === 0 && isResendDisabled) {
      setIsResendDisabled(false);
    }
    return undefined;
  }, [countdown, isResendDisabled]);

  const router = useRouter();

  const handleResend = () => {
    resendCode();
    setIsResendDisabled(true);
    setCountdown(30);
  };

  return (
    <>
      <div className="space-y-1 text-center">
        <h1 className="font-medium text-[32px] text-foreground tracking-tight">
          {isVerified ? "Verified!" : "Verify your account"}
        </h1>
        <p className="font-[380] text-[16px] text-muted-foreground">
          {isVerified
            ? "Your account has been verified. Redirecting to My Space..."
            : `A verification code has been sent to ${emailToPhone(email) || "your phone number"}`}
        </p>
      </div>

      {!isVerified && (
        <div className="mt-8 space-y-8">
          <div className="space-y-6">
            <p className="text-center text-muted-foreground text-sm">
              Enter the 6-digit code to verify your account.
            </p>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={handleOtpChange}
                disabled={isLoading}
                className={cn("gap-2", isInvalidOtp && "border-red-500")}
              >
                <InputOTPGroup className="gap-2 [&>div]:rounded-[10px]">
                  <InputOTPSlot
                    index={0}
                    className={cn(
                      "h-12 w-12 rounded-[10px] border bg-card text-center font-medium text-lg shadow-sm transition-all duration-200",
                      "border-border hover:border-primary/30",
                      "focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10",
                      isInvalidOtp &&
                        "border-destructive focus:border-destructive focus:ring-destructive/20",
                    )}
                  />
                  <InputOTPSlot
                    index={1}
                    className={cn(
                      "h-12 w-12 rounded-[10px] border bg-card text-center font-medium text-lg shadow-sm transition-all duration-200",
                      "border-border hover:border-primary/30",
                      "focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10",
                      isInvalidOtp &&
                        "border-destructive focus:border-destructive focus:ring-destructive/20",
                    )}
                  />
                  <InputOTPSlot
                    index={2}
                    className={cn(
                      "h-12 w-12 rounded-[10px] border bg-card text-center font-medium text-lg shadow-sm transition-all duration-200",
                      "border-border hover:border-primary/30",
                      "focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10",
                      isInvalidOtp &&
                        "border-destructive focus:border-destructive focus:ring-destructive/20",
                    )}
                  />
                  <InputOTPSlot
                    index={3}
                    className={cn(
                      "h-12 w-12 rounded-[10px] border bg-card text-center font-medium text-lg shadow-sm transition-all duration-200",
                      "border-border hover:border-primary/30",
                      "focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10",
                      isInvalidOtp &&
                        "border-destructive focus:border-destructive focus:ring-destructive/20",
                    )}
                  />
                  <InputOTPSlot
                    index={4}
                    className={cn(
                      "h-12 w-12 rounded-[10px] border bg-card text-center font-medium text-lg shadow-sm transition-all duration-200",
                      "border-border hover:border-primary/30",
                      "focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10",
                      isInvalidOtp &&
                        "border-destructive focus:border-destructive focus:ring-destructive/20",
                    )}
                  />
                  <InputOTPSlot
                    index={5}
                    className={cn(
                      "h-12 w-12 rounded-[10px] border bg-card text-center font-medium text-lg shadow-sm transition-all duration-200",
                      "border-border hover:border-primary/30",
                      "focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10",
                      isInvalidOtp &&
                        "border-destructive focus:border-destructive focus:ring-destructive/20",
                    )}
                  />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {errorMessage && (
              <div className="mt-1 space-y-1 text-center text-destructive text-xs">
                <p>{errorMessage}</p>
              </div>
            )}
          </div>

          <Button
            onClick={verifyCode}
            className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-primary py-[6px] pr-[10px] pl-[12px] text-[15px] font-medium text-primary-foreground shadow-sm transition-all"
            disabled={!isOtpComplete || isLoading}
          >
            {isLoading ? "Verifying..." : "Verify"}
          </Button>

          <div className="text-center">
            <p className="text-muted-foreground text-sm">
              Didn&apos;t receive a code?{" "}
              {countdown > 0 ? (
                <span>
                  Resend in{" "}
                  <span className="font-medium text-foreground">
                    {countdown}s
                  </span>
                </span>
              ) : (
                <button
                  className="font-medium text-primary underline-offset-4 transition hover:text-primary/80 hover:underline"
                  onClick={handleResend}
                  disabled={isLoading || isResendDisabled}
                >
                  Resend
                </button>
              )}
            </p>
          </div>

          <div className="text-center font-light text-[14px]">
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  sessionStorage.removeItem("verificationEmail");
                  sessionStorage.removeItem("inviteRedirectUrl");
                  sessionStorage.removeItem("isInviteFlow");
                }
                router.push("/register");
              }}
              className="font-medium text-primary underline-offset-4 transition hover:text-primary/80 hover:underline"
            >
              Back to signup
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function VerificationFormFallback() {
  return (
    <div className="text-center">
      <div className="animate-pulse">
        <div className="mx-auto mb-4 h-8 w-48 rounded bg-muted" />
        <div className="mx-auto h-4 w-64 rounded bg-muted" />
      </div>
    </div>
  );
}

export function VerifyForm({
  isProduction = false,
}: {
  isProduction?: boolean;
}) {
  return (
    <Suspense fallback={<VerificationFormFallback />}>
      <VerificationForm isProduction={isProduction} />
    </Suspense>
  );
}
