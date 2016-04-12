#!/usr/bin/env bash
set -euo pipefail
set -o xtrace
IFS=$'\n\t'

#Set hosts based off branch
if [[ "$GIT_BRANCH" == "origin/master"  ]] ; then
  export PROJECT_ROOT='/srv/flowers'
  export SSH_HOSTS=( 'ubuntu@' )
  export NODE_ENV=prod
elif [[ "$GIT_BRANCH" == "origin/staging" ]] ; then
  export PROJECT_ROOT='/srv/flowers'
  export SSH_HOSTS=( 'ubuntu@52.207.233.92' )
  export NODE_ENV=staging
elif [[ "$GIT_BRANCH" == "origin/dev"  ]] ; then
  export PROJECT_ROOT='/srv/flowers'
  export SSH_HOSTS=( 'ubuntu@54.152.166.210' )
  export NODE_ENV=dev
fi

#Scripts to run on servers
for SSH_HOST in "${SSH_HOSTS[@]}"
do
  ssh $SSH_HOST " \
  set -euo pipefail; \
  set -o xtrace; \
  IFS=$'\n\t'; \
  \
  cd $PROJECT_ROOT; \
  forever stopall; \
  sudo chown -R ubuntu $PROJECT_ROOT; \
  git pull; \
  npm install; \
  npm run compile; \
  sudo chgrp -R www-data www;\
  NODE_ENV=$NODE_ENV forever start www/server.js
  "
  done
