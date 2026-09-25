#!/usr/bin/env bash
#
# Pretty-print every ".jsonl" file in the playground directory with jq. Each
# file is written to a temp file first, so a parse error leaves it untouched.

set -euo pipefail

# =========================================================================== #
#                                  CONSTANTS                                  #
# =========================================================================== #

# Resolve from the repo root so the script can run from any directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIRECTORY_PATH="$ROOT_DIR/playground"

# =========================================================================== #
#                                     RUN                                     #
# =========================================================================== #

if ! command -v jq > /dev/null; then
  echo "jq is required: https://jqlang.org/download" >&2
  exit 1
fi

# Expand to nothing (instead of the literal pattern) when there are no matches
shopt -s nullglob

for file in "$DIRECTORY_PATH"/*.jsonl; do
  tmp="$file.$$.tmp"
  if jq . "$file" > "$tmp"; then
    mv "$tmp" "$file"
    echo "Formatted ${file#"$ROOT_DIR"/}"
  else
    rm -f "$tmp"
    exit 1
  fi
done
