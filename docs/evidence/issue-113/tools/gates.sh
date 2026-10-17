#!/bin/bash
# Release gates on clean clones of a tag. Usage: gates.sh <tag> <workdir> <node-bin-dir>
# Part 1: the tag as is (recipe libraries linked as CI does), plus a web export
# with .env.example (demo backends) for the web smoke. Part 2: after
# init-project --remove-demo --remove-recipes, with a leftover search.
set -u
TAG="$1"; W="$2"; export PATH="$3:$PATH"
run() { echo "\$ $*"; "$@" 2>&1 | tail -"${TAILN:-6}"; echo "exit ${PIPESTATUS[0]}"; }
gates() {
  TAILN=3 run npm run lint
  TAILN=3 run npm run type-check
  TAILN=3 run npm run format:check
  TAILN=3 run npm run docs:check
  TAILN=6 run npm run test:ci
  TAILN=6 run npm run audit:check
  TAILN=3 run npm run doctor
  echo "\$ web export"; EXPO_PUBLIC_API_URL=https://api.example.com EXPO_PUBLIC_AUTH_API_URL=https://auth.example.com npx expo export --platform web --clear --output-dir "$1" 2>&1 | tail -1; echo "exit ${PIPESTATUS[0]}"
  echo "\$ native bundles"; APP_VARIANT=production EXPO_PUBLIC_APP_ENV=production npx expo export --platform ios --platform android --output-dir "$1-native" 2>&1 | tail -1; echo "exit ${PIPESTATUS[0]}"
}
for part in 1 2; do
  D="$W/clone$part"
  echo; echo "== Part $part: clean clone of tag $TAG ($(date -u +%FT%TZ)), node $(node -v), npm $(npm -v)"
  git -c advice.detachedHead=false clone -q --branch "$TAG" https://github.com/koniz-dev/react-native-starter.git "$D"; cd "$D" || exit 1
  git log -1 --format='%H %s'
  npm ci --no-audit --no-fund >/dev/null 2>&1; echo "npm ci exit $?"
  if [ "$part" = 1 ]; then
    npm ci --prefix docs/recipes --legacy-peer-deps --ignore-scripts --no-audit --no-fund >/dev/null 2>&1; echo "recipes npm ci exit $?"
    for pkg in $(node -p "Object.keys(require('./docs/recipes/package.json').dependencies).join(' ')"); do
      mkdir -p "node_modules/$(dirname "$pkg")"; ln -sfn "$PWD/docs/recipes/node_modules/$pkg" "node_modules/$pkg"
    done
  else
    echo "\$ init-project --remove-demo --remove-recipes"
    node scripts/init-project.js --name 'Acme Notes' --bundle-id com.acme.notes --owner 'Acme Inc.' --remove-demo --remove-recipes 2>&1 | tail -2; echo "exit ${PIPESTATUS[0]}"
    echo "leftovers (outside tests and the lockfile):"
    git grep -n -i -E "react-native-starter|rnstarter|@demo|@recipes|remove-block|demo-|dummyjson|emilys|starter template|recipes/" -- . ':(exclude)__tests__' ':(exclude)package-lock.json'; echo "(git grep exit $?; 1 = nothing found)"
    echo "docs/:"; ls docs; echo ".maestro/subflows:"; ls .maestro/subflows
  fi
  gates "$W/dist$part"
  if [ "$part" = 1 ]; then
    echo "\$ web export with .env.example (demo backends), for the web smoke"
    cp .env.example .env; npx expo export --platform web --clear --output-dir "$W/dist-web-demo" 2>&1 | tail -1; echo "exit ${PIPESTATUS[0]}"; rm .env
  fi
  echo "git status after the gates:"; git status --short | head -5; echo "($(git status --short | wc -l | tr -d ' ') entries)"
done
