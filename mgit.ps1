# ANSI Color Codes
$CYAN = "$([char]27)[0;36m"
$YELLOW = "$([char]27)[1;33m"
$GREEN = "$([char]27)[0;32m"
$RED = "$([char]27)[0;31m"
$BOLD = "$([char]27)[1m"
$NC = "$([char]27)[0m" # No Color

# Default git command if none is provided
$GitCmd = if ($args.Count -eq 0) {
    @("status", "-s")
} else {
    $args
}

$GitCmdString = $GitCmd -join " "

# Find all direct subdirectories
$gitSubdirs = [System.Collections.Generic.List[string]]::new()
Get-ChildItem -Directory | ForEach-Object {
    $dirName = $_.Name
    $gitPath = Join-Path $_.FullName ".git"
    
    # Check if directory contains .git (either as a folder or file for submodules)
    if ((Test-Path -LiteralPath $gitPath -PathType Container) -or (Test-Path -LiteralPath $gitPath -PathType Leaf)) {
        $gitSubdirs.Add($dirName)
    }
}

if ($gitSubdirs.Count -gt 0) {
    Write-Host "${CYAN}Running git operation: ${BOLD}git ${GitCmdString}${NC}"
    Write-Host ""
    
    foreach ($dirName in $gitSubdirs) {
        # Determine current branch safely
        $branch = git --no-pager -C $dirName symbolic-ref --short HEAD 2>$null
        if ($null -eq $branch -or $branch -eq "") {
            $branch = git --no-pager -C $dirName rev-parse --short HEAD 2>$null
        }
        if ($null -eq $branch -or $branch -eq "") {
            $branch = "detached HEAD"
        } else {
            $branch = $branch.Trim()
        }
        
        # Print a clear, beautiful colored header
        Write-Host "${CYAN}================================================================================${NC}"
        Write-Host "${CYAN}📂 Folder: ${BOLD}${YELLOW}${dirName}${NC} ${CYAN}│ Branch: ${BOLD}${GREEN}${branch}${NC}"
        Write-Host "${CYAN}================================================================================${NC}"
        
        # Execute the git command inside the target directory
        git --no-pager -C $dirName $GitCmd
        
        # Add an extra newline for spacing between directories
        Write-Host ""
    }
} else {
    if ((Test-Path -LiteralPath ".git" -PathType Container) -or (Test-Path -LiteralPath ".git" -PathType Leaf)) {
        git $GitCmd
        exit $LASTEXITCODE
    }
}
