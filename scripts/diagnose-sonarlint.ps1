#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Diagnostic and troubleshooting script for SonarLint/SonarQube for IDE performance issues.

.DESCRIPTION
    This script:
    1. Checks for stuck processes
    2. Analyzes SonarLint configuration
    3. Gathers diagnostic information
    4. Provides recommendations for fixing performance issues

.EXAMPLE
    .\diagnose-sonarlint.ps1
#>

param(
    [switch]$KillStuckProcesses,
    [switch]$AutoFix
)

$ErrorActionPreference = "Stop"
$InformationPreference = "Continue"

# Color output helpers
function Write-Header {
    param([string]$Message)
    Write-Host "`n===================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "===================================`n" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠ $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Blue
}

# 1. Check for stuck processes
Write-Header "1. Checking for Stuck Processes"

$longRunningProcesses = Get-Process | Where-Object { 
    $_.ProcessName -like "*node*" -and 
    $_.StartTime -and 
    $_.StartTime -lt (Get-Date).AddHours(-1) 
} | Select-Object ProcessName, Id, StartTime, @{
    Name="RuntimeHours"
    Expression={[math]::Round(((Get-Date) - $_.StartTime).TotalHours, 2)}
}, @{
    Name="MemoryMB"
    Expression={[math]::Round($_.WorkingSet / 1MB, 2)}
}

if ($longRunningProcesses) {
    Write-Warning "Found $($longRunningProcesses.Count) long-running Node.js processes:"
    $longRunningProcesses | Format-Table -AutoSize
    
    if ($KillStuckProcesses -or $AutoFix) {
        Write-Info "Killing stuck processes..."
        $longRunningProcesses | ForEach-Object {
            Write-Warning "Killing process $($_.Id) - Running for $($_.RuntimeHours) hours"
            Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        }
        Write-Success "Stuck processes killed"
    } else {
        Write-Info "Run with -KillStuckProcesses to terminate these processes"
    }
} else {
    Write-Success "No stuck processes found"
}

# 2. Check SonarLint Extension
Write-Header "2. Checking SonarLint Extension"

try {
    $extensions = code --list-extensions 2>&1
    $sonarExtension = $extensions | Select-String -Pattern "sonarsource.sonarlint-vscode"
    
    if ($sonarExtension) {
        Write-Success "SonarLint extension is installed: $sonarExtension"
    } else {
        Write-Error "SonarLint extension NOT found"
        Write-Info "Install with: code --install-extension sonarsource.sonarlint-vscode"
    }
} catch {
    Write-Warning "Could not check VS Code extensions: $_"
}

# 3. Check SonarLint Configuration
Write-Header "3. Checking SonarLint Configuration"

$vscodeSettingsPath = "$env:APPDATA\Code\User\settings.json"
if (Test-Path $vscodeSettingsPath) {
    Write-Success "VS Code settings found: $vscodeSettingsPath"
    
    $settings = Get-Content $vscodeSettingsPath -Raw | ConvertFrom-Json
    $sonarSettings = $settings.PSObject.Properties | Where-Object { $_.Name -like "sonarlint*" }
    
    if ($sonarSettings) {
        Write-Info "Current SonarLint settings:"
        $sonarSettings | ForEach-Object {
            Write-Host "  - $($_.Name): $($_.Value)" -ForegroundColor Gray
        }
    } else {
        Write-Warning "No SonarLint settings found in VS Code configuration"
    }
} else {
    Write-Warning "VS Code settings file not found"
}

# 4. Check Project Configuration
Write-Header "4. Checking Project Configuration"

$projectRoot = $PSScriptRoot -replace '\\scripts$', ''
$sonarPropertiesPath = Join-Path $projectRoot "sonar-project.properties"
$sonarlintPath = Join-Path $projectRoot ".sonarlint"

if (Test-Path $sonarPropertiesPath) {
    Write-Success "Found sonar-project.properties"
    $props = Get-Content $sonarPropertiesPath
    Write-Info "Configuration:"
    $props | Where-Object { $_ -match "^sonar\." } | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Gray
    }
} else {
    Write-Warning "sonar-project.properties not found"
}

if (Test-Path $sonarlintPath) {
    Write-Success "Found .sonarlint directory"
    $connectedModeFile = Join-Path $sonarlintPath "connectedMode.json"
    if (Test-Path $connectedModeFile) {
        Write-Info "Connected Mode configuration:"
        $connectedMode = Get-Content $connectedModeFile -Raw | ConvertFrom-Json
        $connectedMode.PSObject.Properties | ForEach-Object {
            Write-Host "  - $($_.Name): $($_.Value)" -ForegroundColor Gray
        }
    }
} else {
    Write-Warning ".sonarlint directory not found"
}

# 5. Check Source Files
Write-Header "5. Analyzing Source Code Size"

$srcPath = Join-Path $projectRoot "hvac-design-app\src"
if (Test-Path $srcPath) {
    $files = Get-ChildItem -Path $srcPath -Recurse -File
    $tsFiles = $files | Where-Object { $_.Extension -in @('.ts', '.tsx') }
    $totalSize = ($files | Measure-Object -Property Length -Sum).Sum
    
    Write-Info "Source code statistics:"
    Write-Host "  - Total files: $($files.Count)" -ForegroundColor Gray
    Write-Host "  - TypeScript files: $($tsFiles.Count)" -ForegroundColor Gray
    Write-Host "  - Total size: $([math]::Round($totalSize / 1MB, 2)) MB" -ForegroundColor Gray
    
    if ($tsFiles.Count -gt 500) {
        Write-Warning "Large codebase detected. This may cause slower analysis."
    } else {
        Write-Success "Codebase size is manageable"
    }
} else {
    Write-Warning "Source directory not found: $srcPath"
}

# 6. Check System Resources
Write-Header "6. Checking System Resources"

$cpu = Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 1
$cpuUsage = [math]::Round($cpu.CounterSamples.CookedValue, 2)

$memory = Get-CimInstance Win32_OperatingSystem
$memoryUsagePercent = [math]::Round((($memory.TotalVisibleMemorySize - $memory.FreePhysicalMemory) / $memory.TotalVisibleMemorySize) * 100, 2)

Write-Info "System resources:"
Write-Host "  - CPU usage: $cpuUsage%" -ForegroundColor Gray
Write-Host "  - Memory usage: $memoryUsagePercent%" -ForegroundColor Gray

if ($cpuUsage -gt 80) {
    Write-Warning "High CPU usage detected. This may slow down SonarLint analysis."
}

if ($memoryUsagePercent -gt 90) {
    Write-Warning "High memory usage detected. This may cause performance issues."
}

# 7. Recommendations
Write-Header "7. Recommendations"

$recommendations = @()

if ($longRunningProcesses) {
    $recommendations += "Kill stuck Node.js processes to free up resources"
}

if (-not $sonarSettings) {
    $recommendations += "Add SonarLint performance optimizations to VS Code settings"
}

if ($tsFiles.Count -gt 500) {
    $recommendations += "Consider excluding large directories from SonarLint analysis"
}

if ($cpuUsage -gt 80 -or $memoryUsagePercent -gt 90) {
    $recommendations += "Close unnecessary applications to free up system resources"
}

$recommendations += "Restart VS Code to reset SonarLint extension state"

if ($recommendations.Count -gt 0) {
    Write-Info "Recommended actions:"
    $recommendations | ForEach-Object {
        Write-Host "  • $_" -ForegroundColor Yellow
    }
} else {
    Write-Success "No immediate issues detected"
}

# 8. Auto-fix options
if ($AutoFix) {
    Write-Header "8. Applying Auto-fixes"
    
    # Update VS Code settings
    if (Test-Path $vscodeSettingsPath) {
        Write-Info "Updating VS Code settings for better SonarLint performance..."
        
        $settings = Get-Content $vscodeSettingsPath -Raw | ConvertFrom-Json
        $settings | Add-Member -MemberType NoteProperty -Name "sonarlint.disableTelemetry" -Value $true -Force
        $settings | Add-Member -MemberType NoteProperty -Name "sonarlint.focusOnNewCode" -Value $true -Force
        
        $settings | ConvertTo-Json -Depth 10 | Set-Content $vscodeSettingsPath
        Write-Success "VS Code settings updated"
    }
    
    Write-Success "Auto-fix completed"
    Write-Info "Please restart VS Code for changes to take effect"
}

Write-Header "Diagnostic Complete"
Write-Info "For more help, visit: https://docs.sonarsource.com/sonarqube-for-ide/vs-code/"
