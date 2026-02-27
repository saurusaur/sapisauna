#!/bin/bash

# PostToolUse hook: Auto-format TS/TSX files after Edit/Write
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [[ "$FILE_PATH" == *.ts || "$FILE_PATH" == *.tsx ]]; then
  npx eslint --fix "$FILE_PATH" 2>/dev/null || true
fi

exit 0
