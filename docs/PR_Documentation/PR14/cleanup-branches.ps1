# Repository Cleanup Script
# Run this script AFTER merging the consolidated PR

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Repository Cleanup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Update local main branch
Write-Host "Step 1: Updating local main branch..." -ForegroundColor Yellow
git checkout main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to checkout main branch" -ForegroundColor Red
    exit 1
}

git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to pull from origin/main" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Main branch updated" -ForegroundColor Green
Write-Host ""

# Step 2: Delete local feature branches
Write-Host "Step 2: Deleting local feature branches..." -ForegroundColor Yellow

$localBranches = @(
    "feature/pr-consolidation",
    "claude/implement-all-phases-HjWq4",
    "claude/review-pr-3-UxFnf"
)

foreach ($branch in $localBranches) {
    $exists = git branch --list $branch
    if ($exists) {
        git branch -d $branch
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Deleted local branch: $branch" -ForegroundColor Green
        } else {
            Write-Host "⚠ Could not delete $branch (may need -D flag)" -ForegroundColor Yellow
            git branch -D $branch
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ Force deleted local branch: $branch" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "- Branch not found locally: $branch" -ForegroundColor Gray
    }
}
Write-Host ""

# Step 3: Delete remote feature branches
Write-Host "Step 3: Deleting remote feature branches..." -ForegroundColor Yellow

$remoteBranches = @(
    "feature/pr-consolidation",
    "claude/implement-all-phases-HjWq4",
    "claude/review-pr-3-UxFnf",
    "claude/review-pr13-fixes-IQTJC",
    "codex/document-user-journey-for-sizewise-hvac-canvas-app",
    "codex/document-user-journey-for-sizewise-hvac-canvas-app-rgtptf",
    "codex/implement-history-recording-for-drag-and-edits",
    "codex/implement-phases-6-to-8-from-plan",
    "codex/verify-phase-7-implementation-details"
)

foreach ($branch in $remoteBranches) {
    git push origin --delete $branch 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Deleted remote branch: $branch" -ForegroundColor Green
    } else {
        Write-Host "- Branch not found on remote: $branch" -ForegroundColor Gray
    }
}
Write-Host ""

# Step 4: Verify repository state
Write-Host "Step 4: Verifying repository state..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Current branch:" -ForegroundColor Cyan
git branch --show-current
Write-Host ""
Write-Host "Recent commits on main:" -ForegroundColor Cyan
git log --oneline -5
Write-Host ""
Write-Host "Remaining local branches:" -ForegroundColor Cyan
git branch
Write-Host ""

# Step 5: Run quality checks
Write-Host "Step 5: Running quality checks..." -ForegroundColor Yellow
Set-Location hvac-design-app

Write-Host "Running type check..." -ForegroundColor Cyan
pnpm type-check
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Type check passed" -ForegroundColor Green
} else {
    Write-Host "✗ Type check failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "Running tests..." -ForegroundColor Cyan
pnpm test
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Tests passed" -ForegroundColor Green
} else {
    Write-Host "✗ Tests failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "Running build..." -ForegroundColor Cyan
pnpm build
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Build successful" -ForegroundColor Green
} else {
    Write-Host "✗ Build failed" -ForegroundColor Red
}

Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Cleanup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Close PRs #4, #5, #10, #11, #12, #13 on GitHub" -ForegroundColor White
Write-Host "2. Review and handle Dependabot PRs (#6-9) individually" -ForegroundColor White
Write-Host "3. Review and handle PR #1 separately" -ForegroundColor White
Write-Host ""

