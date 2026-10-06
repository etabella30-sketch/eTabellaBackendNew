# Makes a self-signed test certificate for this box's address and installs it in the box.
# Run AFTER "enroll" (the box must know its address). Usage:  .\make-cert.ps1
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
$main = Join-Path $PSScriptRoot 'main.js'
$openssl = 'C:\Program Files\Git\mingw64\bin\openssl.exe'

$status = node $main status --json --config box.json | ConvertFrom-Json
$hostName = $status.identity.host
if (-not $hostName) { $hostName = $status.certificate.host }
if (-not $hostName) { throw 'The box is not enrolled yet (run enroll first).' }
Write-Host "Box address: https://$hostName"

$tmp = Join-Path $PSScriptRoot 'data\cert-tmp'
New-Item -ItemType Directory -Force $tmp | Out-Null
& $openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:P-256 -nodes -days 60 `
  -subj "/CN=$hostName" -addext "subjectAltName=DNS:$hostName" `
  -keyout "$tmp\key.pem" -out "$tmp\cert.pem"
if ($LASTEXITCODE -ne 0) { throw 'openssl failed' }

node $main cert install --key "$tmp\key.pem" --chain "$tmp\cert.pem" --config box.json
Remove-Item -Recurse -Force $tmp
Write-Host ''
Write-Host "Add this line to C:\Windows\System32\drivers\etc\hosts (Notepad as Administrator):"
Write-Host "127.0.0.1 $hostName"
