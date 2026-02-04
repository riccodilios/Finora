/**
 * RBAC - Role-Based Access Control
 * 
 * Defines user roles and access permissions
 */

export type UserRole = "user" | "admin" | "support";

/**
 * Check if a user has a specific role
 */
export async function getUserRole(clerkUserId: string): Promise<UserRole> {
  // In production, this should query a roles table or check user metadata
  // For now, hardcode admin check (same as existing admin check)
  const ADMIN_USER_ID = "user_38vftq2ScgNF9AEmYVnswcUuVpH";
  
  if (clerkUserId === ADMIN_USER_ID) {
    return "admin";
  }
  
  // TODO: Add support role check from database
  // For now, default to "user"
  return "user";
}

/**
 * Check if user can view raw financial data
 * Admins and support cannot view raw values by default (privacy protection)
 */
export async function canViewRawFinancialData(
  clerkUserId: string,
  targetUserId: string
): Promise<boolean> {
  const role = await getUserRole(clerkUserId);
  
  // Users can only view their own data
  if (clerkUserId === targetUserId) {
    return true;
  }
  
  // Admins and support cannot view raw financial data by default
  // They would need explicit permission/override (not implemented here)
  return false;
}

/**
 * Check if user can access financial data
 */
export async function canAccessFinancialData(
  clerkUserId: string,
  targetUserId: string
): Promise<boolean> {
  const role = await getUserRole(clerkUserId);
  
  // Users can access their own data
  if (clerkUserId === targetUserId) {
    return true;
  }
  
  // Admins and support can access (but not raw values)
  if (role === "admin" || role === "support") {
    return true;
  }
  
  return false;
}

/**
 * Check if user can modify financial data
 */
export async function canModifyFinancialData(
  clerkUserId: string,
  targetUserId: string
): Promise<boolean> {
  // Only users can modify their own data
  return clerkUserId === targetUserId;
}
