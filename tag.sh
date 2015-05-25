#!/bin/bash
if [ -z "$1" ]
  then
    echo "You must specify the version of tag 1.0.4"
    exit 1
fi
VERSION=$1
git tag -a $VERSION -m '$VERSION tag for release'
git push origin $VERSION
