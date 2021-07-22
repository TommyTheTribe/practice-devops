#!/bin/sh
set -e
cd "$(dirname "$0")"

VERSION="0.3.0"
PACKAGE="practice-devops-1"

DOCKER_TAG=${DOCKER_TAG:-$VERSION}
DOCKER_REGISTRY=${DOCKER_REGISTRY:=rg.fr-par.scw.cloud/thetribe}
DOCKER_IMAGE=${DOCKER_IMAGE:=$DOCKER_REGISTRY/$PACKAGE:$DOCKER_TAG}
DOCKERFILE=${DOCKERFILE:-"Dockerfile"}
SECURITY=${SECURITY:-"false"}
DOCKER_STAGE=${DOCKER_STAGE:-""}

# ssh key for gitlab.com, needed for grunt
DEPLOY_KEY_FILE=${DEPLOY_KEY_FILE:=~/.ssh/id_rsa}
DEPLOY_KEY=`cat ${DEPLOY_KEY_FILE}`

print_help () {
  echo "Usage: ${SCRIPTNAME} [--push] [--sec] [-h|--help]

  Build image with package $PACKAGE
  Available parameters:

    --build-env         Build build-env stage only
    --push              Push docker image to the registry \$DOCKER_REGISTRY
    --sec               Obfuscate the javascript code (not used)
    --help              Print this help message"
  exit 0
}

build_image () {
  # Stop at the build stage if required
  if [ ! -z "$DOCKER_STAGE" ]; then TARGET="--target $DOCKER_STAGE"; fi

  # multi-stage build made easy
  docker build \
    $TARGET \
    --pull \
    --force-rm \
    --no-cache \
    --label "commit-sha=$COMMIT_SHA" \
    --tag "$DOCKER_IMAGE" \
    --build-arg SSH_PRIVATE_KEY="$DEPLOY_KEY" \
    --build-arg SECURITY="$SECURITY" \
    -f $DOCKERFILE \
    .

  echo "Docker image successfully built:
       Dockerfile recipe: $DOCKERFILE
       Package: $PACKAGE
       Version: $DOCKER_TAG
       Registry: $DOCKER_REGISTRY"
}

push_image () {
  docker push $DOCKER_IMAGE
  echo "Docker image pushed: $DOCKER_IMAGE"
}

#
# MAIN
#
while test -n "$1"; do
  case "$1" in
    --push)
      PUSH_ENABLED="true" ;;
    --sec)
      SECURITY="true" ;;
    --build-env)
      DOCKER_STAGE="build-env" ;;
    -h|--help)
      print_help ;;
  esac
  shift
done

# Update tags for obfuscated source code
if [ "$SECURITY" = "true" ]; then DOCKER_TAG="${DOCKER_TAG}-sec"; fi

build_image
[ -n "$PUSH_ENABLED" ] && push_image

exit 0
