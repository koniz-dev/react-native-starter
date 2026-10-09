#!/usr/bin/env bash
# Bootstrap the issue-workflow labels for this repository.
# Idempotent: `gh label create --force` updates color/description if the label exists.
# Usage:
#   ./scripts/bootstrap-issue-labels.sh
#   REPO=owner/name ./scripts/bootstrap-issue-labels.sh
#
# This file is the canonical source for the epic list (see docs/issue-workflow.md).
# Native issue types are an organization-level repo setting, not labels; this repo is
# user-owned, so the type family below (bug / enhancement / task) stands in for them.

set -euo pipefail

REPO="${REPO:-koniz-dev/react-native-starter}"

label() {
  local name="$1" color="$2" description="$3"
  gh label create "$name" --repo "$REPO" --force \
    --color "$color" --description "$description"
  echo "  ok: $name"
}

echo "Bootstrapping labels on $REPO"

# --- Type family (one per issue) ---------------------------------------------
label "bug"         "d73a4a" "Something isn't working"
label "enhancement" "a2eeef" "New feature or request"
label "task"        "bfd4f2" "Chore, refactor, or maintenance work"

# --- Epic family (canonical epic list) ---------------------------------------
label "epic:navigation" "1d76db" "Expo Router: app/ routes and layouts"
label "epic:ui"         "5319e7" "shared/ui: theme, shared components, Paper theming"
label "epic:services"   "0e8a16" "shared/: config, http, session, storage, lib; feature APIs"
label "epic:state"      "fbca04" "State management: session provider and recipes"
label "epic:testing"    "c2e0c6" "Jest/RNTL tests and test configuration"
label "epic:docs"       "0075ca" "README, docs/, per-directory guides"
label "epic:tooling"    "e99695" "ESLint, Prettier, TS config, scripts, CI"

# --- Priority family ----------------------------------------------------------
label "priority:P0" "b60205" "Drop everything"
label "priority:P1" "d93f0b" "High priority"
label "priority:P2" "fbca04" "Normal priority"
label "priority:P3" "c5def5" "Nice to have"

# --- Status family (exactly one per triaged open issue) -----------------------
label "status:todo"        "ededed" "Triaged and ready to be claimed"
label "status:in-progress" "0052cc" "Claimed; assignee is actively working"
label "status:needs-uat"   "d4c5f9" "Awaiting human verification of criteria"
label "status:blocked"     "000000" "Stuck; comment says what is needed"

echo "Done."
