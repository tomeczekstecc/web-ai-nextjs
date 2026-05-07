---
name: cleanup
description: Clean up project housekeeping tasks (add "run" to execute fixes)
argument-hint: run|check
---

Review the codebase for cleanup tasks:

1. Find unnecessary console.log statements in src/
2. Find unused imports
3. Check for stale TODO comments
4. Find orphaned/unused files
5. Check that context files match actual project state
6. Keep `.env` and `.env.example` in sync — compare variable names (not values); whichever file has more variables wins, add any missing keys to the other.
7. Find `@ts-ignore` comments that might be stale
8. Run `/ai-artifacts-sync` to keep `.claude/` and `.agents/` skill directories in sync

**Mode: $ARGUMENTS**

If no argument or argument is "check":

- Only report findings, don't modify anything
- List what WOULD be cleaned up

If the argument is "run" or "fix":

- First, report all findings with numbered items
- Then ask: "Which items would you like me to fix? (enter numbers like 1,3,5 or 'all' or 'none')"
- Wait for user response before making any changes
- Only fix the items the user specifies
- Report what you changed
