"use client";

import { useState } from "react";

interface PaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  userEmail: string;
  clerkUserId: string;
}

export default function PaymentForm({
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
  userEmail,
  clerkUserId
}: PaymentFormProps) {
  const [cardDetails, setCardDetails] = useState({
    number: "4111 1111 1111 1111", // Test card pre-filled
    name: "Test User",
    month: "12",
    year: "30",
    cvc: "123"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Remove spaces from card number
      const cleanCardNumber = cardDetails.number.replace(/\s/g, '');

      const response = await fetch("/api/pay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 999,
          description: "Finora Pro Plan",
          userEmail,
          clerkUserId,
          cardNumber: cleanCardNumber,
          cardName: cardDetails.name,
          cardMonth: cardDetails.month,
          cardYear: cardDetails.year,
          cardCvc: cardDetails.cvc
        }),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        onError(data.error || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      onError("Payment processing error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Format card number with spaces
    if (name === "number") {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setCardDetails(prev => ({ ...prev, [name]: formatted }));
    } else {
      setCardDetails(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Card Number
        </label>
        <input
          type="text"
          name="number"
          value={cardDetails.number}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="1234 5678 9012 3456"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cardholder Name
        </label>
        <input
          type="text"
          name="name"
          value={cardDetails.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="John Doe"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Month
          </label>
          <select
            name="month"
            value={cardDetails.month}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
              <option key={month} value={month.toString().padStart(2, '0')}>
                {month.toString().padStart(2, '0')}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <select
            name="year"
            value={cardDetails.year}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2000 + i).map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CVC
          </label>
          <input
            type="text"
            name="cvc"
            value={cardDetails.cvc}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="123"
            maxLength={4}
            required
          />
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
        <p className="text-sm text-blue-700">
          💳 <strong>Test Card:</strong> 4111 1111 1111 1111 | Any future date | CVC: 123
        </p>
        <p className="text-xs text-blue-600 mt-1">
          No real money will be charged. This is a test transaction.
        </p>
      </div>

      <button
        type="submit"
        disabled={isProcessing}
        className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing Payment...
          </span>
        ) : (
          "💳 Pay 9.99 SAR"
        )}
      </button>
    </form>
  );
}