# Generate Encryption Key on Windows

## Method 1: Using Node.js (Recommended)

Since you have Node.js installed for this project, use it:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example output**:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

## Method 2: Using PowerShell (Native)

```powershell
-join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

Or a more reliable version:

```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
$key = -join ($bytes | ForEach-Object { $_.ToString("x2") })
Write-Host $key
```

## Method 3: Create a Simple Script

Create a file `generate-key.js` in your project root:

```javascript
const crypto = require('crypto');
console.log(crypto.randomBytes(32).toString('hex'));
```

Then run:
```powershell
node generate-key.js
```

## Method 4: Install OpenSSL for Windows (Optional)

If you want to use OpenSSL:

1. Download from: https://slproweb.com/products/Win32OpenSSL.html
2. Install it
3. Add to PATH (or use full path)
4. Then run: `openssl rand -hex 32`

---

## Quick Copy-Paste Solution

**Just run this in PowerShell:**

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `FINANCIAL_DATA_ENCRYPTION_KEY` in Convex dashboard.
