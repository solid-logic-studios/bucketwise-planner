#!/usr/bin/env bash
set -euo pipefail

# Sync standard labels for this repository using GitHub CLI.
# Requires GitHub CLI: https://cli.github.com/
# Usage:
#   ./backend/scripts/setup-labels.sh

REPO="PaulAtkins88/bucketwise-planner"

create_label() {
  local name="$1"; shift
  local color="$1"; shift
  local description="$*"
  gh label create "$name" --color "$color" --description "$description" --repo "$REPO" 2>/dev/null || \
  gh label edit "$name" --color "$color" --description "$description" --repo "$REPO"
}

create_label "bug" "CC0000" "Something isn’t working"
create_label "enhancement" "1D76DB" "New feature or request"
create_label "documentation" "0075CA" "Improve or add docs"
create_label "good first issue" "7057FF" "Good for newcomers"
create_label "help wanted" "008672" "Extra attention is needed"
create_label "question" "D876E3" "Further information is requested"
create_label "discussion" "BFDADC" "Brainstorming / design discussion"
create_label "security" "000000" "Security-related change or report"
create_label "testing" "FBCA04" "Tests and coverage"
create_label "chore" "C5DEF5" "Maintenance task"
create_label "refactor" "F9D0C4" "Refactor without behavior change"
create_label "performance" "5319E7" "Performance improvement"
create_label "dependencies" "0366D6" "Dependency updates"
create_label "wontfix" "FFFFFF" "Will not be fixed"
create_label "invalid" "E4E669" "Not a valid issue"
create_label "duplicate" "C0C0C0" "Duplicate of another issue"

echo "Labels synced for $REPO"
