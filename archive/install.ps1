# Target installation directory
$InstallDir = ""

if ($IsWindows -or $env:OS -like "*Windows*") {
    $InstallDir = Join-Path $env:USERPROFILE ".local\bin"
} else {
    $usrLocalBin = "/usr/local/bin"
    $isWritable = $false
    try {
        if (Test-Path $usrLocalBin) {
            $testFile = Join-Path $usrLocalBin ".mgit_write_test"
            [System.IO.File]::WriteAllText($testFile, "test")
            Remove-Item -Path $testFile -ErrorAction SilentlyContinue | Out-Null
            $isWritable = $true
        }
    } catch {
        $isWritable = $false
    }

    if ($isWritable) {
        $InstallDir = $usrLocalBin
    } else {
        $InstallDir = Join-Path $HOME ".local\bin"
    }
}

if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

$RepoUrl = "https://raw.githubusercontent.com/doggy8088/mgit/main"
$DestFile = Join-Path $InstallDir "mgit.ps1"

Write-Host "Installing mgit.ps1 to $InstallDir..."

if (Test-Path "./mgit.ps1") {
    # Local installation
    Copy-Item -Path "./mgit.ps1" -Destination $DestFile -Force
} else {
    # Remote installation via Invoke-RestMethod
    $RemoteUrl = "$RepoUrl/mgit.ps1"
    try {
        Invoke-RestMethod -Uri $RemoteUrl -OutFile $DestFile
    } catch {
        Write-Error "Error: Failed to download mgit.ps1 from $RemoteUrl"
        exit 1
    }
}

Write-Host "Successfully installed mgit.ps1 to $DestFile!"

# Check if PATH contains $InstallDir
$PathDirs = $env:PATH -split [IO.Path]::PathSeparator
$IsInPath = $false
$ResolvedInstallDir = (Resolve-Path $InstallDir -ErrorAction SilentlyContinue).Path
if ($null -eq $ResolvedInstallDir) {
    $ResolvedInstallDir = $InstallDir
}

foreach ($p in $PathDirs) {
    $resolvedP = (Resolve-Path $p -ErrorAction SilentlyContinue).Path
    if ($null -ne $resolvedP -and $resolvedP -eq $ResolvedInstallDir) {
        $IsInPath = $true
        break
    }
}

if (-not $IsInPath) {
    Write-Host ""
    Write-Host "Warning: $InstallDir is not in your PATH." -ForegroundColor Yellow
    if ($IsWindows -or $env:OS -like "*Windows*") {
        Write-Host "You can add it to your user PATH by running:"
        Write-Host "  [Environment]::SetEnvironmentVariable('Path', `"`$env:Path;$InstallDir`", 'User')"
    } else {
        Write-Host "You may need to add it to your shell configuration (e.g., ~/.bashrc, ~/.zshrc or your PowerShell profile):"
        Write-Host "  export PATH=`"`$PATH:$InstallDir`""
    }
}
