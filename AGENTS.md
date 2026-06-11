
## RTK Token Saving Rules

Use RTK whenever inspecting files, git status, diffs, search results, logs, test output, or build output.

Prefer:
- `rtk ls .` instead of `ls -la`
- `rtk read path/to/file` instead of `cat path/to/file`
- `rtk grep "pattern" .` instead of raw `grep -R` or `rg`
- `rtk find "*.php" .` instead of raw `find`
- `rtk git status` instead of `git status`
- `rtk git diff` instead of `git diff`

Do not dump huge logs, vendor folders, node_modules, storage logs, build outputs, or full large files into context.
Summarize first, then inspect only relevant files.

## Frontend Project Rules

This is the Vue frontend project.
Use RTK for file inspection, git status, diff, grep, logs, and build/test output.

Do not change layout, menu structure, routing, or reusable components unless the task explicitly asks for it.
Preserve fixed features and run regression checks after changes.
