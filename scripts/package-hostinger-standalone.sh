#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
output_path="${1:-$repo_dir/../BACKEND-STANDALONE-LATEST.zip}"
stage_dir="$(mktemp -d)"
trap 'rm -rf "$stage_dir"' EXIT

cp -R "$repo_dir/apps/api/src" "$stage_dir/src"
cp -R "$repo_dir/apps/api/prisma" "$stage_dir/prisma"
cp -R "$repo_dir/packages/shared" "$stage_dir/shared"
cp "$repo_dir/deploy/hostinger-standalone/package.json" "$stage_dir/package.json"
cp "$repo_dir/deploy/hostinger-standalone/tsconfig.json" "$stage_dir/tsconfig.json"
cp "$repo_dir/deploy/hostinger-standalone/nest-cli.json" "$stage_dir/nest-cli.json"
cp "$repo_dir/deploy/hostinger-standalone/server.cjs" "$stage_dir/server.cjs"
mkdir -p "$stage_dir/scripts"
cp "$repo_dir/deploy/hostinger-standalone/embed-shared.cjs" "$stage_dir/scripts/embed-shared.cjs"

(cd "$stage_dir" && zip -qr "$output_path" . -x 'shared/dist/*')
printf '%s\n' "$output_path"
