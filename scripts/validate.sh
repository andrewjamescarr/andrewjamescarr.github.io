#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Building site..."
docker compose run --rm -e BUNDLE_PATH=vendor/bundle jekyll bundle install
docker compose run --rm -e BUNDLE_PATH=vendor/bundle jekyll bundle exec jekyll build

echo "Running HTML/link checks..."
docker compose run --rm -e BUNDLE_PATH=vendor/bundle jekyll bundle exec htmlproofer /srv/jekyll/_site \
  --checks Links,Images,Scripts \
  --check-internal-hash \
  --allow-hash-href \
  --disable-external

echo "Validation complete."
