# Quality Check & Code Review

## Overview
Comprehensive quality assurance workflow: run automated checks, auto-fix issues, and conduct code review using the checklist framework.

## Automated Quality Checks

### 1. Run checks in sequence
Execute in order, stopping at first failure:
- `pnpm run lint` (Linting process)
- `pnpm run type-check` (TypeScript validation)
- `pnpm run build` (compilation check)

### 2. Fix issues automatically
- Fix one issue at a time, starting with the first failure
- Re-run the relevant check after each fix
- Continue only when current check passes

### 3. Escalate complex issues
If a failure is ambiguous, requires domain knowledge, or could introduce errors:
- Report to user with specific error context
- Don't attempt risky fixes requiring human judgment

## Code Review Checklist

When automated checks pass or for manual review, verify:

### Functionality
- [ ] Code implements intended behavior
- [ ] Edge cases handled appropriately
- [ ] Error handling is robust
- [ ] No logic errors or bugs

### Code Quality
- [ ] Readable and well-structured
- [ ] Functions are focused and single-purpose
- [ ] Descriptive variable/function names
- [ ] No unnecessary duplication
- [ ] Follows project conventions


## Workflow
1. Run automated checks (including security audit) → auto-fix → verify
2. If all checks pass, use expanded checklist for final review (including security items)
3. If checks fail with complex issues, report and pause for guidance
