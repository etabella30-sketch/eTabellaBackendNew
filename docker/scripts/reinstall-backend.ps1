param([switch]$ValidateOnly, [switch]$ExportBase)

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

function Initialize-BaseImage {
    # The base image only carries OS packages and node_modules, so it is labelled with the
    # dependency manifests and reused while they are unchanged. A server that cannot download
    # packages loads docker\monorepo-base-<deps>.tar, made elsewhere with -ExportBase.
    $depsHash = (Get-BundleHash -Path (Join-Path $backendRoot 'package.json')).Substring(0, 12) +
        (Get-BundleHash -Path (Join-Path $backendRoot 'package-lock.json')).Substring(0, 12)
    $baseArchive = Join-Path $backendRoot "docker\monorepo-base-$depsHash.tar"
    # JSON avoids a quoted template, which Windows PowerShell 5.1 mangles when calling docker.
    $getBaseDeps = {
        if (!(& docker image ls --quiet monorepo-base:latest)) { return $null }
        $labels = (& docker image inspect --format '{{json .Config.Labels}}' monorepo-base:latest) | ConvertFrom-Json
        if ($labels) { return $labels.'etabella.deps' }
    }
    $baseDeps = & $getBaseDeps
    if ($baseDeps -ne $depsHash -and (Test-Path -LiteralPath $baseArchive -PathType Leaf)) {
        Write-Host "Loading prebuilt base image $baseArchive ..."
        Invoke-Docker -Arguments @('load', '-i', $baseArchive) | Out-Host
        $baseDeps = & $getBaseDeps
    }
    if ($baseDeps -eq $depsHash) {
        Write-Host 'Reusing monorepo-base:latest; package.json and package-lock.json are unchanged.'
        return $baseArchive
    }
    try {
        Invoke-Docker -Arguments @('build', '-t', 'monorepo-base:latest', '--label', "etabella.deps=$depsHash",
            '-f', 'docker/microservices/monorepo-base.Dockerfile', '.') | Out-Host
    }
    catch {
        throw "$($_.Exception.Message)`nIf this server cannot download packages, run reinstall-backend.ps1 -ExportBase on a machine with internet access and the same package.json, then copy $(Split-Path -Leaf $baseArchive) into the docker folder here."
    }
    return $baseArchive
}

Push-Location $backendRoot
try {
    Write-Host '[1/6] Checking Docker, configuration and compiled applications...'
    Invoke-Docker -Arguments @('info', '--format', '{{.OSType}}')
    # Older installs baked docker\microservices\.env into the images; Compose now mounts .env.docker.
    $runtimeEnv = Join-Path $backendRoot '.env.docker'
    $legacyEnv = Join-Path $backendRoot 'docker\microservices\.env'
    if (!(Test-Path -LiteralPath $runtimeEnv -PathType Leaf) -and (Test-Path -LiteralPath $legacyEnv -PathType Leaf)) {
        Copy-Item -LiteralPath $legacyEnv -Destination $runtimeEnv
        Write-Host 'Created .env.docker from docker\microservices\.env (the configuration the old images used).'
    }
    foreach ($required in @('docker\.env', '.env.docker', 'package.json', 'package-lock.json')) {
        if (!(Test-Path -LiteralPath (Join-Path $backendRoot $required) -PathType Leaf)) {
            throw "Required file is missing: $required"
        }
    }
    if ($ExportBase) {
        $baseArchive = Initialize-BaseImage
        Invoke-Docker -Arguments @('save', '-o', $baseArchive, 'monorepo-base:latest')
        Write-Host "Saved $baseArchive. Copy it into the docker folder of the offline server."
        return
    }
    # The Docker setup is tracked in git, so switching to a branch without it deletes these files.
    $dockerSetup = @('docker\docker-compose.yml', 'docker\microservices\monorepo-base.Dockerfile',
        'docker\microservices\service.Dockerfile', 'docker\microservices\healthcheck.cjs', '.dockerignore')
    $missingSetup = @($dockerSetup | Where-Object { !(Test-Path -LiteralPath (Join-Path $backendRoot $_) -PathType Leaf) })
    if ($missingSetup.Count -gt 0) {
        throw "Docker setup files are missing: $($missingSetup -join ', '). The current git branch may not include them; restore them from a branch that does (e.g. security/auth-hardening)."
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
    # A host process (e.g. a local `node start-app.js` dev server) on a published port makes
    # step 6 fail after the images are rebuilt. Docker's own listeners are fine.
    $portConflicts = foreach ($service in $serviceConfigs) {
        foreach ($port in @($service.Value.ports | Where-Object { $_.protocol -eq 'tcp' -and $_.published -match '^\d+$' })) {
            $listener = Get-NetTCPConnection -LocalPort ([int]$port.published) -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
            if (!$listener) { continue }
            $owner = Get-Process -Id $listener.OwningProcess -ErrorAction SilentlyContinue
            if ($owner -and $owner.ProcessName -notmatch '^(com\.docker\.|docker|wslrelay|vpnkit)') {
                "port $($port.published) ($($service.Name)) is used by $($owner.ProcessName) PID $($owner.Id)"
            }
        }
    }
    if ($portConflicts) {
        throw "Stop these local processes first: $($portConflicts -join '; ')"
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

    Write-Host '[3/6] Preparing the shared dependencies image...'
    Initialize-BaseImage | Out-Null

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
