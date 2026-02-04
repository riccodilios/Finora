import { ReactNode } from "react";

interface FinoraCardProps {
  children: ReactNode;
  className?: string;
  padding?: string;
  hover?: boolean;
}

/**
 * Base44 Finora Card Component
 * - Layered surfaces, not outlined boxes
 * - Dark mode: #1e293b background
 * - Light mode: white background
 * - Floating effect with subtle shadow
 * - No borders
 * - Rounded corners (rounded-2xl)
 */
export function FinoraCard({ 
  children, 
  className = "", 
  padding = "p-6",
  hover = true 
}: FinoraCardProps) {
  return (
    <div 
      className={`
        finora-card
        ${padding}
        ${hover ? "hover:shadow-md transition-shadow duration-200" : ""} 
        transition-colors
        min-w-0
        ${className}
      `.trim().replace(/\s+/g, " ")}
    >
      {children}
    </div>
  );
}
