# Branch Protection Rules

This document describes the recommended branch protection rules for the HVAC Canvas App repository to ensure code quality and prevent breaking changes.

## Table of Contents

1. [Overview](#overview)
2. [Protection Rules for Main Branch](#protection-rules-for-main-branch)
3. [Protection Rules for Develop Branch](#protection-rules-for-develop-branch)
4. [Setup Instructions](#setup-instructions)
5. [Workflow](#workflow)
6. [Exemptions](#exemptions)
7. [Troubleshooting](#troubleshooting)

## Overview

Branch protection rules enforce specific workflows before code can be merged into protected branches. This ensures:

- All code is reviewed before merging
- CI tests pass before deployment
- Code quality standards are maintained
- Breaking changes are caught early
- Team collaboration is enforced

## Protection Rules for Main Branch

### Recommended Settings

**Branch name pattern:** `main`

#### 1. Require Pull Request Reviews
- ✅ **Require a pull request before merging**
- ✅ **Require approvals**: 1 (increase to 2+ for production)
- ✅ **Dismiss stale pull request approvals when new commits are pushed**
- ✅ **Require review from Code Owners** (if CODEOWNERS file exists)
- ⚠️  **Restrict who can dismiss pull request reviews**: Repository admins only

#### 2. Require Status Checks to Pass
- ✅ **Require status checks to pass before merging**
- ✅ **Require branches to be up to date before merging**

**Required status checks:**
```
- Lint & Type Check
- Unit Tests
- Build Application (production)
- Coverage Check
- PR Validation
- Dependency Audit
```

#### 3. Require Conversation Resolution
- ✅ **Require conversation resolution before merging**
  - All PR comments must be resolved

#### 4. Require Signed Commits
- ⚠️  **Require signed commits** (optional, recommended for security)
  - Ensures commits are from verified authors

#### 5. Require Linear History
- ✅ **Require linear history**
  - Prevents merge commits, requires rebase or squash

#### 6. Include Administrators
- ⚠️  **Do not include administrators** (allows admins to bypass for emergencies)
  - Or ✅ **Include administrators** (strict mode, even admins must follow rules)

#### 7. Restrict Pushes
- ✅ **Restrict who can push to matching branches**
  - Only allow pull requests, no direct pushes
  - Exemptions: CI/CD service accounts (if needed)

#### 8. Allow Force Pushes
- ❌ **Do not allow force pushes**
  - Prevents history rewriting

#### 9. Allow Deletions
- ❌ **Do not allow deletions**
  - Prevents accidental branch deletion

### Configuration Summary

```yaml
# Example: .github/branch-protection.yml (pseudocode)
main:
  required_pull_request_reviews:
    required_approving_review_count: 1
    dismiss_stale_reviews: true
    require_code_owner_reviews: true

  required_status_checks:
    strict: true
    contexts:
      - "Lint & Type Check"
      - "Unit Tests"
      - "Build Application (production)"
      - "Coverage Check"
      - "PR Validation"
      - "Dependency Audit"

  enforce_admins: true
  require_linear_history: true
  allow_force_pushes: false
  allow_deletions: false
  require_conversation_resolution: true

  restrictions:
    users: []
    teams: []
```

## Protection Rules for Develop Branch

### Recommended Settings

**Branch name pattern:** `develop`

Similar to `main`, but with slightly relaxed rules for development velocity:

#### Differences from Main

1. **Require Pull Request Reviews**
   - ✅ Require approvals: 1
   - ⚠️  Dismiss stale reviews: Optional (can be disabled for faster iteration)

2. **Require Status Checks**
   - ✅ All checks must pass
   - ⚠️  Up-to-date requirement: Optional (can be disabled)

3. **Require Linear History**
   - ⚠️  Optional (allows merge commits for feature branches)

4. **Include Administrators**
   - ⚠️  Do not include administrators (allows quick fixes)

### Configuration Summary

```yaml
# Example: .github/branch-protection.yml (pseudocode)
develop:
  required_pull_request_reviews:
    required_approving_review_count: 1
    dismiss_stale_reviews: false

  required_status_checks:
    strict: false
    contexts:
      - "Lint & Type Check"
      - "Unit Tests"
      - "Build Application (development)"
      - "Coverage Check"

  enforce_admins: false
  require_linear_history: false
  allow_force_pushes: false
  allow_deletions: false
```

## Setup Instructions

### Via GitHub Web UI

1. **Navigate to Settings**
   - Go to repository → Settings → Branches

2. **Add Branch Protection Rule**
   - Click "Add branch protection rule"
   - Enter branch name pattern: `main`

3. **Configure Rules**
   - Check all recommended boxes from [Protection Rules for Main Branch](#protection-rules-for-main-branch)
   - Add required status checks (must match exact names from workflows)

4. **Save Changes**
   - Click "Create" or "Save changes"

5. **Repeat for Develop Branch**
   - Create another rule for `develop` with adjusted settings

### Via GitHub CLI

```bash
# Protect main branch
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_pull_request_reviews[required_approving_review_count]=1 \
  --field required_pull_request_reviews[dismiss_stale_reviews]=true \
  --field enforce_admins=true \
  --field required_linear_history=true

# Add required status checks
gh api repos/:owner/:repo/branches/main/protection/required_status_checks \
  --method PATCH \
  --field strict=true \
  --field contexts[]='Lint & Type Check' \
  --field contexts[]='Unit Tests' \
  --field contexts[]='Build Application (production)' \
  --field contexts[]='Coverage Check'
```

### Via Terraform (Infrastructure as Code)

```hcl
resource "github_branch_protection" "main" {
  repository_id = github_repository.hvac_canvas_app.node_id
  pattern       = "main"

  required_pull_request_reviews {
    required_approving_review_count = 1
    dismiss_stale_reviews           = true
    require_code_owner_reviews      = true
  }

  required_status_checks {
    strict = true
    contexts = [
      "Lint & Type Check",
      "Unit Tests",
      "Build Application (production)",
      "Coverage Check",
      "PR Validation",
      "Dependency Audit"
    ]
  }

  enforce_admins              = true
  require_linear_history      = true
  allow_force_pushes         = false
  allow_deletions            = false
  require_conversation_resolution = true
}
```

## Workflow

### Standard Development Flow

```
feature/new-feature
     ↓
     PR → develop (requires 1 approval + CI pass)
     ↓
     PR → main (requires 1 approval + CI pass)
     ↓
   Tagged Release (v1.0.0)
     ↓
   Tauri Release Workflow
```

### Creating a Feature Branch

```bash
# From develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/my-new-feature

# Make changes, commit
git add .
git commit -m "feat: add new feature"

# Push to remote
git push -u origin feature/my-new-feature
```

### Creating a Pull Request

1. **Push your branch** to GitHub
2. **Open PR** targeting `develop` (or `main` for hotfixes)
3. **Fill in PR template** with description, testing notes
4. **Wait for CI checks** to complete
5. **Request review** from team members
6. **Address feedback** and push changes
7. **Merge** once approved and CI passes

### Merging to Main

```bash
# After PR is approved and CI passes
# Option 1: Squash merge (recommended)
gh pr merge <pr-number> --squash

# Option 2: Rebase merge (preserves commits)
gh pr merge <pr-number> --rebase

# Option 3: Merge commit (creates merge commit)
gh pr merge <pr-number> --merge
```

## Exemptions

### When to Bypass Protection Rules

⚠️ **Use sparingly and only for emergencies!**

**Valid reasons:**
- Critical production bug requiring immediate hotfix
- Security vulnerability that must be patched ASAP
- CI system is down and blocking legitimate merges

**Process:**
1. Document reason for bypass in issue or PR
2. Get approval from team lead or repository admin
3. Admin temporarily disables protection or uses admin override
4. Merge fix
5. Re-enable protection rules immediately
6. Create follow-up PR to add missing tests/reviews

### Granting Exemptions

**Via GitHub Web UI:**
1. Settings → Branches → Edit protection rule
2. Temporarily uncheck required checks or disable rule
3. Merge PR
4. Re-enable protection immediately

**Best Practice:**
- Never disable protection rules permanently
- Always re-enable within 1 hour
- Document all bypasses in repository issues

## Troubleshooting

### Common Issues

#### 1. "Required status check X has not run"

**Cause:** Status check name doesn't match workflow job name exactly

**Solution:**
```bash
# Check workflow job names in .github/workflows/ci.yml
# Update branch protection to match exact names

# Get job names from recent run
gh run list --limit 5
gh run view <run-id> --log
```

#### 2. "This branch is out-of-date with the base branch"

**Cause:** Required branches to be up-to-date before merging

**Solution:**
```bash
# Update your branch
git checkout feature/my-branch
git fetch origin
git rebase origin/develop  # or origin/main

# Resolve conflicts if any
git push --force-with-lease
```

#### 3. "All conversations must be resolved"

**Cause:** Unresolved PR comments

**Solution:**
- Go through each comment thread
- Address feedback or mark as resolved
- Push changes if needed

#### 4. "Review required"

**Cause:** No approving review yet

**Solution:**
- Request review from team members
- Wait for approval
- Address review comments

#### 5. "CI check failed"

**Cause:** Tests, lint, or build failed

**Solution:**
```bash
# Run checks locally
npm run lint
npm run type-check
npm run test
npm run build:prod

# Fix issues
git add .
git commit -m "fix: resolve CI issues"
git push
```

### Testing Protection Rules

**Before enabling on main:**

1. **Test on feature branch first**
   ```bash
   # Create test protection rule
   gh api repos/:owner/:repo/branches/test-protection/protection \
     --method PUT --field enforce_admins=true
   ```

2. **Verify all CI checks work**
   - Push to branch
   - Verify all required checks run and pass
   - Check status check names match exactly

3. **Test PR workflow**
   - Create test PR
   - Verify protection rules work as expected
   - Test merge restrictions

4. **Enable on main once verified**

## Best Practices

### Do's ✅

- ✅ Enable protection rules from day one
- ✅ Require CI checks before merging
- ✅ Use descriptive PR titles and descriptions
- ✅ Keep branches up-to-date
- ✅ Resolve conversations promptly
- ✅ Review protection rules quarterly

### Don'ts ❌

- ❌ Disable protection rules casually
- ❌ Force push to protected branches
- ❌ Bypass reviews without documentation
- ❌ Merge PRs with failing CI
- ❌ Approve your own PRs (if repo settings allow)
- ❌ Commit directly to main/develop

## Security Considerations

### Commit Signing

**Setup GPG signing:**
```bash
# Generate GPG key
gpg --full-generate-key

# Add to GitHub
gpg --armor --export <key-id>
# Paste in GitHub Settings → SSH and GPG keys

# Configure git
git config --global user.signingkey <key-id>
git config --global commit.gpgsign true
```

### CODEOWNERS File

Create `.github/CODEOWNERS`:
```
# Require review from code owners
* @team-leads
/src/core/** @core-team
/src/features/canvas/** @canvas-team
/.github/workflows/** @devops-team
```

## References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [Git Workflow Best Practices](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow)
- [Semantic Versioning](https://semver.org/)
