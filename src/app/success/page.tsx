"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useUser } from "@clerk/nextjs";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const upgradeToPro = useMutation(api.functions.upgradeToPro);
  const [status, setStatus] = useState("Confirming payment...");

  useEffect(() => {
    const processPayment = async () => {
      try {
        const paymentId = searchParams.get("payment_id");
        const status = searchParams.get("status");

        if (!paymentId || !user) {
          setStatus("Payment confirmation failed");
          return;
        }

        if (status === "paid") {
          await upgradeToPro({
            clerkUserId: user.id,
            moyasarPaymentId: paymentId,
            amount: 10000,
            currency: "SAR",
            timestamp: new Date().toISOString(),
          });

          setStatus("Payment confirmed. Updating your account...");
          
          setTimeout(() => {
            router.push("/dashboard/subscription");
          }, 3000);
        } else {
          setStatus("Payment was not successful. Please try again.");
        }
      } catch (error) {
        console.error("Payment processing error:", error);
        setStatus("Unable to confirm payment. Please contact support.");
      }
    };

    processPayment();
  }, [searchParams, user, upgradeToPro, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Payment confirmation</h1>
        <p className="text-gray-600 mb-6">{status}</p>
        <div className="animate-pulse">
          <div className="h-2 bg-green-200 rounded-full w-3/4 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}