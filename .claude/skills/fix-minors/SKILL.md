---
name: fix-minors
description: Automatically fetches, reviews, and addresses minor comments / PR review nits for a given pull request.
---
# Fix Minors Skill

This skill automates the process of identifying, analyzing, and fixing minor/nit comments from pull request reviews. It checks out the PR branch, parses review comments, verifies correctness against the sibling `cascade` repository if needed, applies fixes, verifies them, and commits/pushes the changes back.

## Usage
Trigger this skill by invoking `/fix-minors <PR_NUMBER>` or by asking the agent to address the minor comments on a specific PR.

---

## Step-by-Step Procedure

### Step 1: Fetch PR Details & Switch Branch
First, retrieve the PR details (including branch name and review comments) and checkout the branch:
1. **Fetch PR details**:
   ```bash
   gh pr view <PR_NUMBER> --json title,state,headRefName,reviews,comments
   ```
2. **Switch to the PR branch**:
   ```bash
   git checkout <BRANCH_NAME>
   ```

### Step 2: Parse Review Comments
Read the PR review body and line comments carefully:
- Identify sections labeled **"Minor notes"**, **"nits"**, **"non-blocking"**, or specific code-level suggestions.
- Extract any files, lines, and descriptions of the requested changes.
- Identify if any backend tRPC endpoints, query parameters, or schemas are mentioned.

### Step 3: Cross-Reference with Cascade (Backend) Sibling Repo
Since `cascade-mobile` is a consumer of the `cascade` API:
- If a comment mentions a tRPC procedure, input schema, or type mismatch, locate the corresponding router file in the sibling repository at:
  `../cascade/src/api/routers/<router_name>.ts`
- Use grep/view tools to inspect the exact procedure name and input parameters in `../cascade` to verify them. **Do not guess or assume the API contract.**

### Step 4: Implement Fixes
Apply the requested changes directly to the codebase:
1. **Cosmetic / Layout Empty States**:
   If a comment mentions components rendering as empty boxes when optional fields are missing, add conditional checks to prevent rendering the container unless at least one child field is present.
2. **Endpoint / Input Mismatches**:
   Change the code to use the correct procedure names and input parameter names identified in Step 3.
3. **Docs / Roadmap Updates**:
   If the PR references a change that affects `ROADMAP.md` or other documentation, make sure to update those files as well to maintain consistency.

### Step 5: Verify Changes
Ensure the changes do not break the build or introduce linting issues:
1. **Run Linter**:
   ```bash
   npm run lint
   ```
2. **Run TypeScript Compiler**:
   ```bash
   npx tsc --noEmit
   ```
   *Note: Ignore type mismatches originating from sibling node_modules (e.g., `@tanstack/query-core` cross-repo issues) if they are pre-existing, but ensure no new errors are introduced in the local `src/` directory.*

### Step 6: Commit and Push
Once verified, stage and commit the changes, then push to the remote branch:
1. **Stage files**:
   ```bash
   git add <modified_files>
   ```
2. **Commit changes**:
   ```bash
   git commit -m "address PR #<PR_NUMBER> review nits: <brief summary of fixes>"
   ```
3. **Push to branch**:
   ```bash
   git push origin <BRANCH_NAME>
   ```
