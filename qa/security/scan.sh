#!/bin/sh
# POSIX shell security scan for Stackline Workflow Sprint.
# Read-only; relies on tools already used by the project (npm, grep).
# Writes evidence files alongside this script.
#
# Usage (from repo root):  sh qa/security/scan.sh

set -eu

OUT_DIR="$(dirname "$0")"
cd "$(dirname "$0")/../.."

echo "[security-qa] npm audit (production dependencies only)"
npm audit --omit=dev > "$OUT_DIR/npm-audit-production.txt" 2>&1 || true

echo "[security-qa] npm audit (full tree, JSON)"
npm audit --json > "$OUT_DIR/npm-audit-all.json" 2>/dev/null || true

echo "[security-qa] grep for risky sinks / hardcoded secrets"
{
  echo "# Risky JS sinks in shipped source"
  grep -RInE \
    '(\binnerHTML\b|\bouterHTML\b|insertAdjacentHTML|document\.write|eval\(|new Function\(|setTimeout[[:space:]]*\([[:space:]]*[\"'\''"]|setInterval[[:space:]]*\([[:space:]]*[\"'\''"])' \
    src index.html 2>/dev/null || true
  echo
  echo "# Secret-shaped strings in repo (excluding lockfile and .git)"
  grep -RInE \
    '(secret|password|api[_-]?key|BEGIN[[:space:]]+(RSA|EC|DSA|OPENSSH|PRIVATE)|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,})' \
    . \
    --exclude-dir=.git \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude=package-lock.json 2>/dev/null || true
} > "$OUT_DIR/grep-findings.txt"

echo "[security-qa] workflow permissions snapshot"
grep -nE '^(permissions:|\s{2}[a-z-]+:\s+(read|write|none)).*$' .github/workflows/*.yml \
  > "$OUT_DIR/workflow-permissions.txt" 2>/dev/null || true

echo "[security-qa] done. Evidence written to $OUT_DIR/"
