/**
 * INFRASTRUCTURE DISCLOSURE PAGE
 * 
 * Regulatory compliance page showing infrastructure configuration.
 * Required for regulatory infrastructure review.
 */

import { getInfrastructureConfig, isKSADataResidency } from "@/lib/infrastructure-config";

export const metadata = {
  title: "Infrastructure Disclosure | Finora",
  description: "Infrastructure and hosting information for regulatory compliance",
};

export default function InfrastructurePage() {
  const config = getInfrastructureConfig();
  const isKSA = isKSADataResidency();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold mb-4">Infrastructure Disclosure</h1>
            <p className="text-muted-foreground text-lg">
              This page provides infrastructure and hosting information for regulatory compliance and transparency.
            </p>
          </div>

          {/* Data Residency & Hosting */}
          <section className="bg-card rounded-lg border p-6 space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Data Residency & Hosting</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <dt className="font-medium text-sm text-muted-foreground">Data Region</dt>
                <dd className="text-lg font-semibold mt-1">{config.dataRegion}</dd>
              </div>
              
              <div>
                <dt className="font-medium text-sm text-muted-foreground">Hosting Provider</dt>
                <dd className="text-lg font-semibold mt-1">{config.hostingProvider}</dd>
              </div>
              
              <div>
                <dt className="font-medium text-sm text-muted-foreground">Hosting Location</dt>
                <dd className="text-lg font-semibold mt-1">{config.hostingLocation}</dd>
              </div>
              
              {config.dataResidencyEnforced && (
                <div>
                  <dt className="font-medium text-sm text-muted-foreground">Data Residency</dt>
                  <dd className="text-lg font-semibold mt-1">
                    Enforced in {config.dataResidencyRegion}
                    {isKSA && (
                      <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        KSA Compliant
                      </span>
                    )}
                  </dd>
                </div>
              )}
            </div>

            {isKSA && (
              <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>KSA Data Residency:</strong> This infrastructure is configured for 
                  Kingdom of Saudi Arabia data residency requirements. All data is stored and 
                  processed within the specified region.
                </p>
              </div>
            )}
          </section>

          {/* Backup & Disaster Recovery */}
          <section className="bg-card rounded-lg border p-6 space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Backup & Disaster Recovery</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <dt className="font-medium text-sm text-muted-foreground">Backup Frequency</dt>
                <dd className="text-lg font-semibold mt-1">{config.backupFrequency}</dd>
              </div>
              
              <div>
                <dt className="font-medium text-sm text-muted-foreground">Backup Retention</dt>
                <dd className="text-lg font-semibold mt-1">{config.backupRetentionDays} days</dd>
              </div>
              
              <div>
                <dt className="font-medium text-sm text-muted-foreground">Recovery Time Objective (RTO)</dt>
                <dd className="text-lg font-semibold mt-1">{config.disasterRecoveryRTO}</dd>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum acceptable downtime
                </p>
              </div>
              
              <div>
                <dt className="font-medium text-sm text-muted-foreground">Recovery Point Objective (RPO)</dt>
                <dd className="text-lg font-semibold mt-1">{config.disasterRecoveryRPO}</dd>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum acceptable data loss
                </p>
              </div>
            </div>
          </section>

          {/* Security & Compliance */}
          <section className="bg-card rounded-lg border p-6 space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Security & Compliance</h2>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <dt className="font-medium text-sm text-muted-foreground">Security Contact</dt>
                <dd className="text-lg font-semibold mt-1">
                  {config.securityContactEmail ? (
                    <a 
                      href={`mailto:${config.securityContactEmail}`}
                      className="text-primary hover:underline"
                    >
                      {config.securityContactEmail}
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Will be available in full release
                    </span>
                  )}
                </dd>
              </div>
              
              <div>
                <dt className="font-medium text-sm text-muted-foreground">Incident Response</dt>
                <dd className="text-lg font-semibold mt-1">
                  {config.incidentResponseEmail ? (
                    <a 
                      href={`mailto:${config.incidentResponseEmail}`}
                      className="text-primary hover:underline"
                    >
                      {config.incidentResponseEmail}
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Will be available in full release
                    </span>
                  )}
                </dd>
              </div>
              
              <div className="md:col-span-2">
                <dt className="font-medium text-sm text-muted-foreground">Compliance Frameworks</dt>
                <dd className="mt-1">
                  <div className="flex flex-wrap gap-2">
                    {config.complianceFramework.map((framework) => (
                      <span
                        key={framework}
                        className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                      >
                        {framework}
                      </span>
                    ))}
                  </div>
                </dd>
              </div>
            </div>
          </section>

          {/* Disaster Recovery Notes */}
          <section className="bg-card rounded-lg border p-6 space-y-4">
            <h2 className="text-2xl font-semibold mb-4">Disaster Recovery Procedures</h2>
            
            <div className="prose prose-sm max-w-none text-muted-foreground">
              <h3 className="text-lg font-semibold text-foreground mb-2">Recovery Procedures</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Automated daily backups are performed at scheduled intervals</li>
                <li>Backups are stored in geographically redundant locations</li>
                <li>Recovery procedures are tested quarterly</li>
                {config.incidentResponseEmail && (
                  <li>Incident response team is available 24/7 via {config.incidentResponseEmail}</li>
                )}
              </ul>
              
              <h3 className="text-lg font-semibold text-foreground mb-2 mt-6">Incident Response</h3>
              <ul className="list-disc list-inside space-y-2">
                {config.incidentResponseEmail ? (
                  <>
                    <li>Security incidents should be reported immediately to {config.incidentResponseEmail}</li>
                    <li>Incident response team will acknowledge receipt within 1 hour</li>
                    <li>Critical incidents will be escalated and addressed according to severity</li>
                    <li>Post-incident reports are generated and reviewed for process improvement</li>
                  </>
                ) : (
                  <li className="italic text-muted-foreground">
                    Incident response contact information will be available in full release. 
                    For urgent security matters during development, please contact your development team.
                  </li>
                )}
              </ul>
            </div>
          </section>

          {/* Metadata */}
          <section className="bg-muted/50 rounded-lg border p-4">
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>Infrastructure Version:</strong> {config.infrastructureVersion}</p>
              <p><strong>Last Updated:</strong> {config.lastUpdated}</p>
              <p className="mt-2 text-xs">
                This information is automatically generated from infrastructure configuration.
                {config.securityContactEmail && (
                  <> For the most current information, contact {config.securityContactEmail}.</>
                )}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
