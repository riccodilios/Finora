/**
 * INFRASTRUCTURE CONFIG - Regulatory infrastructure metadata
 * 
 * This configuration is used for regulatory compliance and infrastructure disclosure.
 * All values can be overridden via environment variables.
 */

export interface InfrastructureConfig {
  // Data residency and hosting
  dataRegion: string;
  hostingProvider: string;
  hostingLocation: string;
  
  // Security and compliance
  securityContactEmail: string;
  incidentResponseEmail: string;
  complianceFramework: string[];
  
  // Backup and disaster recovery
  backupFrequency: string;
  backupRetentionDays: number;
  disasterRecoveryRTO: string; // Recovery Time Objective
  disasterRecoveryRPO: string; // Recovery Point Objective
  
  // Data residency flags
  dataResidencyEnforced: boolean;
  dataResidencyRegion: string;
  
  // Infrastructure metadata
  infrastructureVersion: string;
  lastUpdated: string;
}

/**
 * Get infrastructure configuration from environment variables or defaults
 * Uses NEXT_PUBLIC_ prefix for client-accessible variables
 */
export function getInfrastructureConfig(): InfrastructureConfig {
  return {
    // Data residency and hosting
    dataRegion: process.env.NEXT_PUBLIC_DATA_REGION || "us-east-1",
    hostingProvider: process.env.NEXT_PUBLIC_HOSTING_PROVIDER || "Vercel",
    hostingLocation: process.env.NEXT_PUBLIC_HOSTING_LOCATION || "United States",
    
    // Security and compliance
    // Prefer server-side env vars, fallback to public, then default to placeholder
    securityContactEmail: process.env.SECURITY_CONTACT_EMAIL || 
      process.env.NEXT_PUBLIC_SECURITY_EMAIL || "",
    incidentResponseEmail: process.env.INCIDENT_RESPONSE_EMAIL ||
      process.env.NEXT_PUBLIC_INCIDENT_EMAIL || "",
    complianceFramework: (process.env.NEXT_PUBLIC_COMPLIANCE_FRAMEWORK || "GDPR,SOC 2")
      .split(",").map(f => f.trim()),
    
    // Backup and disaster recovery
    backupFrequency: process.env.NEXT_PUBLIC_BACKUP_FREQUENCY || "Daily",
    backupRetentionDays: parseInt(process.env.NEXT_PUBLIC_BACKUP_RETENTION_DAYS || "30", 10),
    disasterRecoveryRTO: process.env.NEXT_PUBLIC_DR_RTO || "4 hours",
    disasterRecoveryRPO: process.env.NEXT_PUBLIC_DR_RPO || "1 hour",
    
    // Data residency flags (defaults to KSA)
    dataResidencyEnforced: process.env.NEXT_PUBLIC_DATA_RESIDENCY_ENFORCED !== "false", // Default true
    dataResidencyRegion: process.env.NEXT_PUBLIC_DATA_RESIDENCY_REGION || "ksa",
    
    // Infrastructure metadata
    infrastructureVersion: process.env.NEXT_PUBLIC_INFRA_VERSION || "1.0.0",
    lastUpdated: process.env.NEXT_PUBLIC_INFRA_LAST_UPDATED || new Date().toISOString().split("T")[0],
  };
}

/**
 * Check if data residency is configured for KSA
 */
export function isKSADataResidency(): boolean {
  const config = getInfrastructureConfig();
  return config.dataResidencyRegion.toLowerCase().includes("ksa") || 
         config.dataResidencyRegion.toLowerCase().includes("saudi") ||
         config.dataRegion.toLowerCase().includes("ksa") ||
         config.dataRegion.toLowerCase().includes("saudi");
}

/**
 * Get formatted infrastructure disclosure text
 */
export function getInfrastructureDisclosure(): string {
  const config = getInfrastructureConfig();
  
  return `
Data Region: ${config.dataRegion}
Hosting Provider: ${config.hostingProvider}
Hosting Location: ${config.hostingLocation}
${config.dataResidencyEnforced ? `Data Residency: Enforced in ${config.dataResidencyRegion}` : ""}
Backup Frequency: ${config.backupFrequency}
Backup Retention: ${config.backupRetentionDays} days
Disaster Recovery RTO: ${config.disasterRecoveryRTO}
Disaster Recovery RPO: ${config.disasterRecoveryRPO}
Security Contact: ${config.securityContactEmail}
Incident Response: ${config.incidentResponseEmail}
Compliance: ${config.complianceFramework.join(", ")}
  `.trim();
}
