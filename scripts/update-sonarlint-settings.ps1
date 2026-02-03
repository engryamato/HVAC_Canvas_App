#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automatically update VS Code settings for optimal SonarLint performance.

.DESCRIPTION
    This script updates the VS Code user settings.json file with recommended
    SonarLint performance optimizations while preserving existing settings.

.EXAMPLE
    .\update-sonarlint-settings.ps1
#>

$ErrorActionPreference = "Stop"

$settingsPath = "$env:APPDATA\Code\User\settings.json"

Write-Host "Updating VS Code settings for SonarLint performance..." -ForegroundColor Cyan

if (-not (Test-Path $settingsPath)) {
    Write-Host "❌ VS Code settings file not found: $settingsPath" -ForegroundColor Red
    exit 1
}

# Backup original settings
$backupPath = "$settingsPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $settingsPath $backupPath
Write-Host "✓ Created backup: $backupPath" -ForegroundColor Green

# Read current settings
$settingsContent = Get-Content $settingsPath -Raw
$settings = $settingsContent | ConvertFrom-Json

# Add/update SonarLint settings
$settings | Add-Member -MemberType NoteProperty -Name "sonarlint.disableTelemetry" -Value $true -Force
$settings | Add-Member -MemberType NoteProperty -Name "sonarlint.focusOnNewCode" -Value $true -Force

# Write updated settings
$settings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath

Write-Host "✓ VS Code settings updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Changes made:" -ForegroundColor Yellow
Write-Host "  • sonarlint.disableTelemetry: true" -ForegroundColor Gray
Write-Host "  • sonarlint.focusOnNewCode: true" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠ Please restart VS Code for changes to take effect" -ForegroundColor Yellow
Write-Host ""
Write-Host "If you need to revert, restore from: $backupPath" -ForegroundColor Gray
