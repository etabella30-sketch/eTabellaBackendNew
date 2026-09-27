param([switch]$ValidateOnly)

$ErrorActionPreference = 'Stop'
$backendRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$composeFile = Join-Path $backendRoot 'docker\docker-compose.yml'

function Invoke-Docker {
    param([string[]]$Arguments)
    & docker @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Docker command failed (exit $LASTEXITCODE): docker $($Arguments -join ' ')"
    }
}

function Get-BundleHash {
    param([string]$Path)
    # Use .NET so this also works in the Windows PowerShell launched by run.bat.
    $stream = [IO.File]::OpenRead($Path)
    $sha = [Security.Cryptography.SHA256]::Create()
    try {
        return [BitConverter]::ToString($sha.ComputeHash($stream)).Replace('-', '').ToLowerInvariant()
    }
    finally {
        $stream.Dispose()
        $sha.Dispose()
    }
}

Push-Location $backendRoot
try {
    Write-Host '[1/6] Checking Docker, configuration and compiled applications...'
    Invoke-Docker -Arguments @('info', '--format', '{{.OSType}}')
    foreach ($required in @('docker\.env', '.env.docker', 'package.json', 'package-lock.json')) {
        if (!(Test-Path -LiteralPath (Join-Path $backendRoot $required) -PathType Leaf)) {
            throw "Required file is missing: $required"
        }
    }
    $rawConfig = & docker compose -f $composeFile config --format json
    if ($LASTEXITCODE -ne 0) { throw 'Docker Compose configuration is invalid.' }
    $config = ($rawConfig -join "`n") | ConvertFrom-Json
    $serviceConfigs = @($config.services.PSObject.Properties | Where-Object {
        $_.Value.build.dockerfile -eq 'docker/microservices/service.Dockerfile'
    })
    if ($serviceConfigs.Count -eq 0) { throw 'No backend services found in Compose.' }
    foreach ($service in $serviceConfigs) {
        $app = $service.Value.build.args.APP_NAME
        if ($app -notmatch '^[a-z][a-z0-9-]*$' -or $app -ne $service.Name) {
            throw "Unexpected APP_NAME for $($service.Name). Check Compose before continuing."
        }
        $bundle = Join-Path $backendRoot "docker\microservices\apps\$app\main.js"
        if (!(Test-Path -LiteralPath $bundle -PathType Leaf) -or (Get-Item -LiteralPath $bundle).Length -eq 0) {
            throw "Compiled application is missing or empty: $bundle"
        }
    }
    # --no-deps below leaves infrastructure running, so check it before any rebuild.
    foreach ($dependency in @('postgres', 'redis', 'kafka', 'minio')) {
        $container = $config.services.$dependency.container_name
        $health = & docker inspect --format '{{.State.Health.Status}}' $container
        if ($LASTEXITCODE -ne 0 -or $health -ne 'healthy') {
            throw "$dependency must be healthy first. Start the stack with menu option [2]."
        }
    }
    $postgresContainer = $config.services.postgres.container_name
    $psql = 'psql -U "$POSTGRES_USER" -d etabella -At -v ON_ERROR_STOP=1'
    $dashboardCheck = "SELECT to_regprocedure('public.et_dashboard(json,refcursor,refcursor,refcursor,refcursor)') IS NULL;"
    $needsDashboardMigration = $dashboardCheck | & docker exec -i $postgresContainer sh -c $psql
    if ($LASTEXITCODE -ne 0 -or $needsDashboardMigration -notin @('t', 'f')) {
        throw 'Could not verify dashboard database compatibility.'
    }
    $dashboardMigration = Join-Path $backendRoot 'docker\postgres\migrations\2026-09-22_dashboard_total_count.sql'
    if ($needsDashboardMigration -eq 't' -and !(Test-Path -LiteralPath $dashboardMigration -PathType Leaf)) {
        throw "Required dashboard migration is missing: $dashboardMigration"
    }
    $services = @($serviceConfigs | ForEach-Object { $_.Name })
    Write-Host "Validated $($services.Count) applications from docker\microservices\apps."
    if ($ValidateOnly) { return }

    Write-Host '[2/6] Saving current backend image versions for rollback...'
    $stamp = 'docker-reinstall-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
    $snapshotDir = Join-Path $backendRoot "backups\$stamp"
    New-Item -ItemType Directory -Path $snapshotDir | Out-Null
    $manifest = foreach ($service in $serviceConfigs) {
        $image = $service.Value.image
        $oldImage = & docker image ls --quiet --no-trunc $image
        if ($LASTEXITCODE -ne 0) { throw "Could not inspect image $image" }
        $rollbackTag = $null
        if ($oldImage) {
            $rollbackTag = "etabella-$($service.Name):$stamp"
            Invoke-Docker -Arguments @('image', 'tag', $oldImage, $rollbackTag)
        }
        $bundle = Join-Path $backendRoot "docker\microservices\apps\$($service.Name)\main.js"
        [pscustomobject]@{
            Service = $service.Name
            PreviousImage = $oldImage
            RollbackTag = $rollbackTag
            BundleSHA256 = Get-BundleHash -Path $bundle
        }
    }
    $manifest | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $snapshotDir 'images.json')
    Write-Host "Rollback image tags recorded in $snapshotDir\images.json"

    Write-Host '[3/6] Building the shared dependencies image...'
    Invoke-Docker -Arguments @('build', '-t', 'monorepo-base:latest', '-f', 'docker/microservices/monorepo-base.Dockerfile', '.')

    Write-Host '[4/6] Rebuilding backend images from the existing compiled applications...'
    Invoke-Docker -Arguments (@('compose', '-f', $composeFile, 'build', '--no-cache') + $services)

    Write-Host '[5/6] Checking the dashboard database function...'
    if ($needsDashboardMigration -eq 't') {
        Get-Content -Raw -LiteralPath $dashboardMigration | & docker exec -i $postgresContainer sh -c $psql
        if ($LASTEXITCODE -ne 0) { throw 'Dashboard compatibility migration failed.' }
        Write-Host 'Added the missing dashboard function. User and case records are unchanged.'
    }
    else {
        Write-Host 'Dashboard function is already compatible; no database change needed.'
    }

    Write-Host '[6/6] Recreating backend containers and waiting for healthy APIs...'
    Invoke-Docker -Arguments (@('compose', '-f', $composeFile, 'up', '-d', '--no-build', '--no-deps', '--force-recreate', '--wait', '--wait-timeout', '240') + $services)
    Invoke-Docker -Arguments (@('compose', '-f', $composeFile, 'ps') + $services)
    Write-Host "Backend reinstall complete: $($services.Count) services are healthy."
    Write-Host 'Database, uploaded files, frontend and runtime configuration are preserved.'
    Write-Host 'Frontend: https://localhost'
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
