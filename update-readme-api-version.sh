#!/bin/bash

if [ -z "$1" ]
  then
    echo "You must specify the current version such as 1.0.12"
    exit 1
fi
VERSION_CURRENT=$1

if [ -z "$2" ]
  then
    echo "You must specify the new version such as 1.0.13"
    exit 1
fi
VERSION_NEW=$2

#sed -i "s/$VERSION_CURRENT/$VERSION_NEW/g" README.md
./node_modules/replace/bin/replace.js $VERSION_CURRENT $VERSION_NEW README.md