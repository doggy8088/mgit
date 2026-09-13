<#
.SYNOPSIS
    Installs mgit from the GitHub releases.

.DESCRIPTION
    Downloads the release archive for this machine, verifies its SHA-256
    checksum and installs the mgit binary. Works with Windows PowerShell 5.1
    and with PowerShell 7+ on Windows, macOS and Linux.

.EXAMPLE
    irm https://raw.githubusercontent.com/doggy8088/mgit/main/install.ps1 | iex

.EXAMPLE
    ./install.ps1 -Version 0.1.0 -InstallDir "$HOME/.local/bin"
#>
[CmdletBinding()]
param(
    # Release to install, for example "0.1.0". Defaults to the latest release.
    [string]$Version = '',
    # Directory that receives the binary.
    [string]$InstallDir = '',
    # Base URL of the release assets, mainly used by the tests.
    [string]$DownloadBase = '',
    # Print the plan and exit without downloading anything.
    [switch]$DryRun,
    # Print this help.
    [switch]$Help
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Repository = 'doggy8088/mgit'
$ProgramName = 'mgit'

function Show-Usage {
    @'
Install mgit from the GitHub releases.

USAGE:
    install.ps1 [-Version <VERSION>] [-InstallDir <DIRECTORY>] [-DownloadBase <URL>] [-DryRun]

OPTIONS:
    -Version <VERSION>     Release to install, for example 0.1.0 (default: latest)
    -InstallDir <DIR>      Directory that receives the binary
    -DownloadBase <URL>    Base URL of the release assets (for testing)
    -DryRun                Print the plan and exit without downloading
    -Help                  Print this help

ENVIRONMENT:
    MGIT_VERSION         Same as -Version
    MGIT_INSTALL_DIR     Same as -InstallDir
    MGIT_DOWNLOAD_BASE   Same as -DownloadBase

EXIT CODES:
    0   mgit was installed
    1   anything went wrong
'@ | Write-Host
}

function Get-EnvironmentValue {
    param([string]$Name)
    $value = [Environment]::GetEnvironmentVariable($Name)
    if ([string]::IsNullOrWhiteSpace($value)) { return '' }
    return $value
}

function Get-PlatformName {
    if ($PSVersionTable.PSEdition -eq 'Core') {
        if ($IsWindows) { return 'windows' }
        if ($IsMacOS) { return 'macos' }
        if ($IsLinux) { return 'linux' }
    }
    # Windows PowerShell only runs on Windows.
    return 'windows'
}

function Get-ArchitectureName {
    $architecture = [System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture
    switch ($architecture.ToString()) {
        'X64' { return 'x86_64' }
        'Arm64' { return 'aarch64' }
        'Arm' { return 'aarch64' }
        default {
            throw "unsupported architecture: $architecture (mgit ships x86_64 and aarch64 builds)"
        }
    }
}

function Get-TargetTriple {
    param([string]$Platform, [string]$Architecture)
    switch ($Platform) {
        'macos' { return "$Architecture-apple-darwin" }
        # The musl builds are static, so they run on every Linux distribution.
        'linux' { return "$Architecture-unknown-linux-musl" }
        'windows' { return "$Architecture-pc-windows-msvc" }
        default { throw "unsupported platform: $Platform" }
    }
}

function Get-ArchiveExtension {
    param([string]$Platform)
    if ($Platform -eq 'windows') { return 'zip' }
    return 'tar.gz'
}

function Get-DefaultInstallDirectory {
    param([string]$Platform)
    if ($Platform -eq 'windows') {
        $profileDirectory = $env:USERPROFILE
        if ([string]::IsNullOrWhiteSpace($profileDirectory)) { $profileDirectory = $HOME }
        return (Join-Path $profileDirectory '.local\bin')
    }

    $systemDirectory = '/usr/local/bin'
    if ((Test-Path -LiteralPath $systemDirectory) -and (Test-PathWritable $systemDirectory)) {
        return $systemDirectory
    }
    return (Join-Path $HOME '.local/bin')
}

function Test-PathWritable {
    param([string]$Path)
    try {
        $probe = Join-Path $Path ('.mgit-write-test-' + [guid]::NewGuid().ToString('n'))
        [System.IO.File]::WriteAllText($probe, 'test')
        Remove-Item -LiteralPath $probe -Force -ErrorAction SilentlyContinue
        return $true
    }
    catch {
        return $false
    }
}

function Get-RemoteFile {
    param([string]$Uri, [string]$Destination)

    if ($PSVersionTable.PSEdition -ne 'Core' -and $PSVersionTable.PSVersion.Major -lt 6) {
        # Windows PowerShell 5.1 defaults to TLS 1.0, GitHub needs 1.2.
        try {
            [Net.ServicePointManager]::SecurityProtocol =
                [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
        }
        catch {
            Write-Verbose "could not raise the TLS version: $($_.Exception.Message)"
        }
    }

    try {
        Invoke-WebRequest -Uri $Uri -OutFile $Destination -UseBasicParsing
    }
    catch {
        throw "failed to download $Uri : $($_.Exception.Message)"
    }
}

function Test-Checksum {
    param([string]$Archive, [string]$ChecksumFile)

    $first = (Get-Content -LiteralPath $ChecksumFile -TotalCount 1)
    if ([string]::IsNullOrWhiteSpace($first)) {
        throw "the checksum file $ChecksumFile is empty"
    }
    $expected = ($first -split '\s+')[0].ToLowerInvariant()
    $actual = (Get-FileHash -LiteralPath $Archive -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($expected -ne $actual) {
        throw "checksum mismatch for $Archive`: expected $expected, got $actual"
    }
}

function Expand-ReleaseArchive {
    param([string]$Archive, [string]$Destination, [string]$Extension)

    if ($Extension -eq 'zip') {
        Expand-Archive -LiteralPath $Archive -DestinationPath $Destination -Force
        return
    }

    & tar -xzf $Archive -C $Destination
    if ($LASTEXITCODE -ne 0) {
        throw "failed to extract $Archive"
    }
}

function Add-ToUserPath {
    param([string]$Directory, [string]$Platform)

    if ($Platform -ne 'windows') {
        Write-Host ''
        Write-Host "Warning: $Directory is not in your PATH."
        Write-Host 'Add it to your shell profile, for example:'
        Write-Host "  zsh:   echo 'export PATH=`"`$PATH:$Directory`"' >> ~/.zshrc"
        Write-Host "  bash:  echo 'export PATH=`"`$PATH:$Directory`"' >> ~/.bashrc"
        return
    }

    $current = [Environment]::GetEnvironmentVariable('Path', 'User')
    if ([string]::IsNullOrWhiteSpace($current)) { $current = '' }

    $entries = @($current -split ';' | Where-Object { -not [string]::IsNullOrWhiteSpace($_) })
    $alreadyThere = $false
    foreach ($entry in $entries) {
        if ($entry.TrimEnd('\') -ieq $Directory.TrimEnd('\')) { $alreadyThere = $true }
    }
    if ($alreadyThere) { return }

    $updated = (@($entries) + $Directory) -join ';'
    [Environment]::SetEnvironmentVariable('Path', $updated, 'User')
    Write-Host ''
    Write-Host "Added $Directory to your user PATH."
    Write-Host 'Open a new terminal (or restart your editor) to pick it up.'
}

if ($Help) {
    Show-Usage
    return
}

if ([string]::IsNullOrWhiteSpace($Version)) { $Version = Get-EnvironmentValue 'MGIT_VERSION' }
if ([string]::IsNullOrWhiteSpace($InstallDir)) { $InstallDir = Get-EnvironmentValue 'MGIT_INSTALL_DIR' }
if ([string]::IsNullOrWhiteSpace($DownloadBase)) { $DownloadBase = Get-EnvironmentValue 'MGIT_DOWNLOAD_BASE' }
if ([string]::IsNullOrWhiteSpace($Version)) { $Version = 'latest' }

# Releases are tagged with a leading `v`, users usually type the plain version.
if ($Version.StartsWith('v')) { $Version = $Version.Substring(1) }

$platform = Get-PlatformName
$architecture = Get-ArchitectureName
$target = Get-TargetTriple -Platform $platform -Architecture $architecture
$extension = Get-ArchiveExtension -Platform $platform
$binaryName = $ProgramName
if ($platform -eq 'windows') { $binaryName = "$ProgramName.exe" }

if ([string]::IsNullOrWhiteSpace($InstallDir)) {
    $InstallDir = Get-DefaultInstallDirectory -Platform $platform
}
$InstallDir = [System.IO.Path]::GetFullPath($InstallDir)

$asset = "$ProgramName-$target.$extension"

if ([string]::IsNullOrWhiteSpace($DownloadBase)) {
    if ($Version -eq 'latest') {
        $DownloadBase = "https://github.com/$Repository/releases/latest/download"
    }
    else {
        $DownloadBase = "https://github.com/$Repository/releases/download/v$Version"
    }
}

Write-Host 'mgit installer'
Write-Host "  version:   $Version"
Write-Host "  target:    $target"
Write-Host "  archive:   $asset"
Write-Host "  source:    $DownloadBase"
Write-Host "  directory: $InstallDir"

if ($DryRun) {
    Write-Host 'Dry run: nothing was downloaded.'
    return
}

$workDirectory = Join-Path ([System.IO.Path]::GetTempPath()) ("mgit-" + [guid]::NewGuid().ToString('n'))
New-Item -ItemType Directory -Path $workDirectory -Force | Out-Null

try {
    $archivePath = Join-Path $workDirectory $asset
    $checksumPath = Join-Path $workDirectory "$asset.sha256"

    Write-Host ''
    Write-Host "Downloading $asset ..."
    Get-RemoteFile -Uri "$DownloadBase/$asset" -Destination $archivePath
    Get-RemoteFile -Uri "$DownloadBase/$asset.sha256" -Destination $checksumPath
    Test-Checksum -Archive $archivePath -ChecksumFile $checksumPath
    Write-Host 'Checksum verified.'

    $extractDirectory = Join-Path $workDirectory 'extract'
    New-Item -ItemType Directory -Path $extractDirectory -Force | Out-Null
    Expand-ReleaseArchive -Archive $archivePath -Destination $extractDirectory -Extension $extension

    $extracted = Join-Path $extractDirectory $binaryName
    if (-not (Test-Path -LiteralPath $extracted)) {
        throw "the archive $asset does not contain $binaryName"
    }

    if (-not (Test-Path -LiteralPath $InstallDir)) {
        New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
    }
    $destination = Join-Path $InstallDir $binaryName
    Copy-Item -LiteralPath $extracted -Destination $destination -Force

    if ($platform -ne 'windows') {
        & chmod +x $destination
    }

    Write-Host ''
    Write-Host "Installed $ProgramName to $destination"
    Add-ToUserPath -Directory $InstallDir -Platform $platform
}
finally {
    Remove-Item -LiteralPath $workDirectory -Recurse -Force -ErrorAction SilentlyContinue
}
