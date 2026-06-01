"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { client, useSession } from "@/common/auth/auth-client";

interface UseVerificationParams {
  isProduction: boolean;
}

interface UseVerificationReturn {
  otp: string;
  email: string;
  isLoading: boolean;
  isVerified: boolean;
  isInvalidOtp: boolean;
  errorMessage: string;
  isOtpComplete: boolean;
  isProduction: boolean;
  verifyCode: () => Promise<void>;
  resendCode: () => void;
  handleOtpChange: (value: string) => void;
}

export function useVerification({
  isProduction,
}: UseVerificationParams): UseVerificationReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetch: refetchSession } = useSession();
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingInitialOtp, setIsSendingInitialOtp] = useState(false);
  const [isInvalidOtp, setIsInvalidOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("verificationEmail");
      if (storedEmail) {
        setEmail(storedEmail);
      }

      const storedRedirectUrl = sessionStorage.getItem("inviteRedirectUrl");
      if (storedRedirectUrl) {
        setRedirectUrl(storedRedirectUrl);
      }
    }

    const redirectParam = searchParams.get("redirectAfter");
    if (redirectParam) {
      setRedirectUrl(redirectParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (email && !isSendingInitialOtp) {
      setIsSendingInitialOtp(true);
    }
  }, [email, isSendingInitialOtp]);

  const isOtpComplete = otp.length === 6;

  async function verifyCode() {
    if (!isOtpComplete || !email) return;

    setIsLoading(true);
    setIsInvalidOtp(false);
    setErrorMessage("");

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const response = await client.signIn.emailOtp({
        email: normalizedEmail,
        otp,
      });

      if (response && !response.error) {
        setIsVerified(true);

        try {
          await refetchSession();
        } catch {
          // Session refetch failed, continue with redirect
        }

        setTimeout(() => {
          if (redirectUrl) {
            window.location.href = redirectUrl;
          } else {
            window.location.href = "/my-space";
          }
        }, 1000);
      } else {
        const message =
          "Invalid verification code. Please check and try again.";
        setIsInvalidOtp(true);
        setErrorMessage(message);
        setOtp("");
      }
    } catch (error: unknown) {
      let message =
        "Verification failed. Please check your code and try again.";
      const errorMsg = error instanceof Error ? error.message : String(error);

      if (errorMsg.includes("expired")) {
        message =
          "The verification code has expired. Please request a new one.";
      } else if (errorMsg.includes("invalid")) {
        message = "Invalid verification code. Please check and try again.";
      } else if (errorMsg.includes("attempts")) {
        message = "Too many failed attempts. Please request a new code.";
      }

      setIsInvalidOtp(true);
      setErrorMessage(message);
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  }

  function resendCode() {
    if (!email) return;

    setIsLoading(true);
    setErrorMessage("");

    const normalizedEmail = email.trim().toLowerCase();
    client.emailOtp
      .sendVerificationOtp({
        email: normalizedEmail,
        type: "sign-in",
      })
      .then(() => {})
      .catch(() => {
        setErrorMessage(
          "Failed to resend verification code. Please try again later.",
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  function handleOtpChange(value: string) {
    if (value.length === 6) {
      setIsInvalidOtp(false);
      setErrorMessage("");
    }
    setOtp(value);
  }

  useEffect(() => {
    if (otp.length === 6 && email && !isLoading && !isVerified) {
      const timeoutId = setTimeout(() => {
        verifyCode();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [otp, email, isLoading, isVerified]);

  return {
    otp,
    email,
    isLoading,
    isVerified,
    isInvalidOtp,
    errorMessage,
    isOtpComplete,
    isProduction,
    verifyCode,
    resendCode,
    handleOtpChange,
  };
}
