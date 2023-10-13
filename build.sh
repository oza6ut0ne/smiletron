#!/bin/bash

while getopts d OPT
do
  case $OPT in
    d) BUILD_COMMAND="build:dev" ;;
  esac
done
shift $((OPTIND - 1))

BUILD_COMMAND=${BUILD_COMMAND:-"build"}
PACKAGE_NAME=$(node -p "require('./package.json').name")
PACKAGE_VERSION=$(node -p "require('./package.json').version")

docker run --rm \
 --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
 --env ELECTRON_CACHE="/root/.cache/electron" \
 --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
 --env NODE_OPTIONS="--openssl-legacy-provider" \
 -v ${PWD}:/project \
 -v ${PWD##*/}-node-modules:/project/node_modules \
 -v ~/.cache/electron:/root/.cache/electron \
 -v ~/.cache/electron-builder:/root/.cache/electron-builder \
 electronuserland/builder:wine \
 bash -c "yarn && npm run ${BUILD_COMMAND} \
          && tar zcvf build/${PACKAGE_NAME}-${PACKAGE_VERSION}-mac.tar.gz -C build/mac ${PACKAGE_NAME}.app \
          && rm -f build/${PACKAGE_NAME}-${PACKAGE_VERSION}-mac.zip \
          && chown -R $(id -u):$(id -g) /project/{build,dist}"
