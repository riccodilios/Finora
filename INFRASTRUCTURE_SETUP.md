# Infrastructure Configuration Guide

This guide explains how to configure Finora's infrastructure metadata for regulatory compliance and infrastructure review.

## Overview

Finora includes infrastructure disclosure capabilities for regulatory compliance. All configuration is done via environment variables, making it easy to adapt for different hosting regions (including future KSA hosting).

## Quick Setup

1. **Copy environment variables** from `.env.example` to your `.env.local`:

```bash
cp .env.example .env.local
```

2. **Configure your infrastructure** by setting the appropriate environment variables in `.env.local`

3. **Deploy** - The infrastructure disclosure page will automatically reflect your configuration

## Configuration Options

### Data Residency & Hosting

```env
# Primary data region
NEXT_PUBLIC_DATA_REGION=us-east-1

# Hosting provider name
NEXT_PUBLIC_HOSTING_PROVIDER=Vercel

# Physical hosting location
NEXT_PUBLIC_HOSTING_LOCATION=United States

# Enable data residency enforcement
NEXT_PUBLIC_DATA_RESIDENCY_ENFORCED=false

# Specific data residency region (if enforced)
NEXT_PUBLIC_DATA_RESIDENCY_REGION=us-east-1
```

### Security & Compliance

```env
# Security contact email (internal)
SECURITY_CONTACT_EMAIL=security@finora.app

# Incident response email (internal)
INCIDENT_RESPONSE_EMAIL=incidents@finora.app

# Public security email (shown on disclosure page)
NEXT_PUBLIC_SECURITY_EMAIL=security@finora.app

# Public incident response email
NEXT_PUBLIC_INCIDENT_EMAIL=incidents@finora.app

# Compliance frameworks (comma-separated)
NEXT_PUBLIC_COMPLIANCE_FRAMEWORK=GDPR,SOC 2
```

### Backup & Disaster Recovery

```env
# Backup frequency
NEXT_PUBLIC_BACKUP_FREQUENCY=Daily

# Backup retention period (days)
NEXT_PUBLIC_BACKUP_RETENTION_DAYS=30

# Recovery Time Objective (maximum acceptable downtime)
NEXT_PUBLIC_DR_RTO=4 hours

# Recovery Point Objective (maximum acceptable data loss)
NEXT_PUBLIC_DR_RPO=1 hour
```

### Infrastructure Metadata

```env
# Infrastructure version
NEXT_PUBLIC_INFRA_VERSION=1.0.0

# Last update date (YYYY-MM-DD format)
NEXT_PUBLIC_INFRA_LAST_UPDATED=2024-01-01
```

## KSA Hosting Configuration

When preparing for KSA hosting, update your environment variables:

```env
# KSA-specific configuration
NEXT_PUBLIC_DATA_REGION=me-south-1
NEXT_PUBLIC_HOSTING_PROVIDER=AWS
NEXT_PUBLIC_HOSTING_LOCATION=Saudi Arabia
NEXT_PUBLIC_DATA_RESIDENCY_ENFORCED=true
NEXT_PUBLIC_DATA_RESIDENCY_REGION=ksa
```

The infrastructure disclosure page will automatically detect KSA configuration and display appropriate compliance badges.

## Accessing Infrastructure Disclosure

The infrastructure disclosure page is available at:

- **URL**: `/infrastructure`
- **Public**: Yes (no authentication required)
- **Purpose**: Regulatory compliance and transparency

## What's Displayed

The infrastructure disclosure page shows:

1. **Data Residency & Hosting**
   - Data region
   - Hosting provider
   - Physical location
   - Data residency status

2. **Backup & Disaster Recovery**
   - Backup frequency
   - Backup retention
   - RTO (Recovery Time Objective)
   - RPO (Recovery Point Objective)

3. **Security & Compliance**
   - Security contact information
   - Incident response contact
   - Compliance frameworks

4. **Disaster Recovery Procedures**
   - Recovery procedures
   - Incident response process

## Environment Variable Priority

1. **Server-side variables** (e.g., `SECURITY_CONTACT_EMAIL`) - Used internally, not exposed to client
2. **Public variables** (e.g., `NEXT_PUBLIC_SECURITY_EMAIL`) - Exposed to client, shown on disclosure page
3. **Defaults** - Fallback values if environment variables are not set

## Security Considerations

- **Never commit** `.env.local` to version control
- **Use secure email addresses** for security and incident response contacts
- **Rotate credentials** regularly
- **Review disclosure page** before going live to ensure accuracy

## Testing

1. **Local testing**: Set environment variables in `.env.local` and run `npm run dev`
2. **Verify disclosure**: Visit `http://localhost:3000/infrastructure`
3. **Check configuration**: Verify all values are correct and formatted properly

## Deployment

### Vercel

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add all `NEXT_PUBLIC_*` variables
4. Redeploy your application

### Other Platforms

Add environment variables according to your platform's documentation. Ensure all `NEXT_PUBLIC_*` variables are set.

## Maintenance

- **Update regularly**: Keep infrastructure metadata current
- **Review quarterly**: Ensure disaster recovery procedures are accurate
- **Update after changes**: Modify configuration when infrastructure changes
- **Version control**: Track infrastructure version changes

## Troubleshooting

### Disclosure page shows defaults

**Issue**: All values show default/placeholder values

**Solution**: 
- Verify environment variables are set correctly
- Ensure `NEXT_PUBLIC_*` prefix is used for client-accessible variables
- Restart development server after changing `.env.local`
- Check deployment environment variables in production

### KSA badge not showing

**Issue**: KSA compliance badge doesn't appear

**Solution**:
- Verify `NEXT_PUBLIC_DATA_RESIDENCY_REGION` includes "ksa" or "saudi"
- Check `NEXT_PUBLIC_DATA_RESIDENCY_ENFORCED=true`
- Ensure region name matches detection logic

### Email links not working

**Issue**: Security/incident email links don't work

**Solution**:
- Verify email addresses are valid
- Check `mailto:` links are properly formatted
- Ensure emails are set in both internal and public variables

## Compliance Notes

- **Regulatory Review**: This configuration supports regulatory infrastructure review
- **Transparency**: All information is publicly accessible for compliance
- **Accuracy**: Ensure all values accurately reflect your infrastructure
- **Updates**: Keep information current as infrastructure evolves

## Future Enhancements

- [ ] Multi-region support
- [ ] Automated compliance framework detection
- [ ] Integration with monitoring systems
- [ ] Real-time infrastructure status
- [ ] Compliance report generation
