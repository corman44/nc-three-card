# Branch Protection Setup

This project uses branch protection to ensure all changes go through pull requests before merging to `main`.

## GitHub Branch Protection Rules

To set up branch protection on GitHub:

1. **Navigate to Repository Settings**
   - Go to your repository on GitHub
   - Click "Settings" tab
   - Click "Branches" in the left sidebar

2. **Add Branch Protection Rule**
   - Click "Add rule" or "Add branch protection rule"
   - Branch name pattern: `main`

3. **Configure Protection Settings**

   **Recommended settings:**
   - ✅ **Require a pull request before merging**
     - Require approvals: 1 (or more if working with a team)
     - Dismiss stale pull request approvals when new commits are pushed

   - ✅ **Require status checks to pass before merging**
     - If you have CI/CD workflows (optional)

   - ✅ **Require conversation resolution before merging**
     - Ensures all PR comments are addressed

   - ✅ **Do not allow bypassing the above settings**
     - Prevents accidental direct pushes to main

   - ⚠️ **Include administrators**
     - Applies rules to repository admins too (recommended)

4. **Save Changes**
   - Click "Create" or "Save changes"

## Workflow with Branch Protection

### Creating a Pull Request

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and commit**
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

3. **Push to GitHub**
   ```bash
   git push -u origin feature/your-feature-name
   ```

4. **Create PR on GitHub**
   - Go to your repository on GitHub
   - Click "Pull requests" tab
   - Click "New pull request"
   - Select your feature branch
   - Add description and create PR

5. **Merge via PR**
   - Review changes
   - Get approvals (if required)
   - Click "Merge pull request"
   - Delete the feature branch after merging

### Direct Push Prevention

With branch protection enabled, direct pushes to `main` will be rejected:

```bash
# This will fail:
git checkout main
git merge feature/my-feature
git push origin main
# Error: protected branch hook declined
```

Instead, you must:
- Push your feature branch
- Create a pull request
- Merge through the PR interface

## Local Development Workflow

For this project, the workflow is:

1. Always work on feature branches:
   - `feature/` - New features
   - `fix/` - Bug fixes
   - `refactor/` - Code improvements
   - `docs/` - Documentation

2. Create meaningful commits with Co-Authored-By tags

3. Push feature branch to GitHub

4. Create PR with description of changes

5. Review and merge via GitHub interface

## Benefits

- **Code Review**: All changes reviewed before merging
- **Quality Control**: Prevents accidental or untested code in main
- **History**: Clean commit history with PR references
- **Collaboration**: Discussion and feedback on changes
- **Rollback**: Easier to identify and revert problematic changes

## Emergency Bypass

If you need to bypass protection temporarily (not recommended):

1. Disable branch protection in GitHub settings
2. Make your changes
3. Re-enable branch protection

**Note**: This should only be done in emergencies and defeats the purpose of branch protection.
