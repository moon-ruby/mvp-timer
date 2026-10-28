#!/usr/bin/env bash
# One-time publish: creates the public GitHub repo, sets build variables, enables Pages, pushes.
set -euo pipefail

REPO=moon-ruby/mvp-timer
cd "$(dirname "$0")/.."

active=$(gh api user --jq .login)
if [ "$active" != "moon-ruby" ]; then
  echo "gh is using '$active'. Run: gh auth switch -u moon-ruby" >&2
  exit 1
fi

gh repo create "$REPO" --public --description "Shared Ragnarok Online MVP respawn timer" --source . --remote origin
gh variable set VITE_SUPABASE_URL -R "$REPO" --body "https://xpayhemtnggvmbmaeysy.supabase.co"
gh variable set VITE_SUPABASE_ANON_KEY -R "$REPO" --body "sb_publishable_5PoBaKwj6qk5-XmCL2Uv_A_o84JDwHy"
gh api -X POST "repos/$REPO/pages" -f build_type=workflow --jq .html_url
git push -u origin main

echo "Published. Site will be live at https://moon-ruby.github.io/mvp-timer/ in ~2 minutes."
