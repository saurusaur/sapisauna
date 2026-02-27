#!/bin/bash

# Verify Gate - Stop Hook
# JSON validity + ESLint warnings only (tsc excluded for performance)

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
ISSUES=()

# JSON validity check for recently modified files
while IFS= read -r -d '' json_file; do
  if ! node -e "JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'))" "$json_file" 2>/dev/null; then
    ISSUES+=("JSON_ERROR: $json_file")
  fi
done < <(find "$PROJECT_DIR" -name "*.json" -newer "$PROJECT_DIR/.git/index" \
  -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/.git/*" -print0 2>/dev/null)

# ESLint check (warnings only, non-blocking)
LINT_OUTPUT=$(npx next lint --quiet 2>&1) || true

if [ ${#ISSUES[@]} -gt 0 ]; then
  echo "검증 실패 (${#ISSUES[@]}건):" >&2
  for issue in "${ISSUES[@]}"; do
    echo "  - $issue" >&2
  done
  exit 2
fi

echo '{"gate":"verify-gate","pass":true}'
exit 0
