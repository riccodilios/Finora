"use client";

import * as React from "react"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, style, ...props }, ref) => {
  const [isDark, setIsDark] = useState(false);
  
  // Check if className contains any background override (including dark: variants)
  const hasBgOverride = className && (
    className.includes('bg-white') || 
    className.includes('bg-[') || 
    className.includes('!bg-') ||
    className.includes('dark:bg-') ||
    className.includes('bg-gray-') ||
    className.includes('bg-slate-') ||
    className.includes('bg-emerald-') ||
    className.includes('bg-red-') ||
    className.includes('bg-blue-') ||
    className.includes('bg-green-') ||
    className.includes('bg-purple-') ||
    className.includes('bg-gradient-')
  );
  
  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Extract dark mode background color if present
  let computedStyle = style;
  if (hasBgOverride && className) {
    const darkBgMatch = className.match(/dark:bg-\[([^\]]+)\]/);
    const lightBgMatch = className.match(/(?:^|\s)bg-white(?:\s|$)/) || className.match(/bg-\[([^\]]+)\]/);
    
    if (darkBgMatch || lightBgMatch) {
      const darkBg = darkBgMatch ? darkBgMatch[1] : null;
      const lightBg = lightBgMatch && !lightBgMatch[1] ? 'white' : (lightBgMatch?.[1] || null);
      
      if (isDark && darkBg) {
        computedStyle = { ...style, backgroundColor: darkBg };
      } else if (!isDark && lightBg) {
        computedStyle = { ...style, backgroundColor: lightBg };
      }
    }
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border shadow",
        !hasBgOverride && "bg-card text-card-foreground",
        className
      )}
      style={computedStyle}
      {...props}
    />
  );
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
