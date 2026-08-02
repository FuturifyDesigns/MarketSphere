# Finish FCM server push for Market Sphere.
# Prerequisites:
#   1. supabase login   (account that owns creaxptcrptygvmtioub)
#   2. Firebase service account JSON on disk
#
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File scripts\finish-fcm-push.ps1
#   powershell -ExecutionPolicy Bypass -File scripts\finish-fcm-push.ps1 -KeyPath "C:\Users\Leonm\Downloads\your-adminsdk.json"

param(
  [string]$ProjectRef = "creaxptcrptygvmtioub",
  [string]$KeyPath = "c:\Users\Leonm\Downloads\market-sphere-group-d4ff9-firebase-adminsdk-fbsvc-2c12d1b351.json"
)

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
Set-Location $repoRoot

if (-not (Test-Path $KeyPath)) {
  throw "Service account file not found: $KeyPath"
}

Write-Host "==> Project: $ProjectRef"
Write-Host "==> Key:     $KeyPath"

$tmpEnv = Join-Path $env:TEMP "msg-fcm-secret-$([guid]::NewGuid().ToString('n')).env"
try {
  $obj = Get-Content $KeyPath -Raw -Encoding UTF8 | ConvertFrom-Json
  if (-not $obj.private_key -or -not $obj.client_email) {
    throw "JSON does not look like a Firebase service account"
  }
  $min = ($obj | ConvertTo-Json -Compress -Depth 20)
  $line = 'FCM_SERVICE_ACCOUNT_JSON="' + ($min -replace '\\', '\\' -replace '"', '\"') + '"'
  [System.IO.File]::WriteAllText($tmpEnv, $line)

  Write-Host "==> Setting FCM_SERVICE_ACCOUNT_JSON secret..."
  supabase secrets set --env-file $tmpEnv --project-ref $ProjectRef --yes
  if ($LASTEXITCODE -ne 0) { throw "secrets set failed (exit $LASTEXITCODE)" }
}
finally {
  if (Test-Path $tmpEnv) { Remove-Item $tmpEnv -Force }
}

Write-Host "==> Deploying push-on-notification (no JWT verify for webhook)..."
supabase functions deploy push-on-notification --no-verify-jwt --project-ref $ProjectRef --use-api
if ($LASTEXITCODE -ne 0) { throw "functions deploy failed (exit $LASTEXITCODE)" }

Write-Host ""
Write-Host "Done. Next (one-time Dashboard webhook):"
Write-Host "  Dashboard → Database → Webhooks → Create a new hook"
Write-Host "  Table: public.notifications | Events: Insert"
Write-Host "  Type: Supabase Edge Functions → push-on-notification"
Write-Host "  OR HTTP: https://$ProjectRef.supabase.co/functions/v1/push-on-notification"
Write-Host ""
Write-Host "Then: run the app, sign in, confirm device_tokens has a non-local token,"
Write-Host "force-stop the app, publish a listing / send enquiry → phone should ping."
