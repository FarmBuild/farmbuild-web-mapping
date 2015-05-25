#!/bin/bash

if [ -z "$1" ]
  then
    echo "You must specify the message for release"
    exit 1
fi
MSG=$1

if [ -z "$2" ]
  then
    echo "You must specify the current version such as 1.0.12"
    exit 1
fi
VERSION_CURRENT=$2

if [ -z "$3" ]
  then
    echo "You must specify the new version such as 1.0.13"
    exit 1
fi
VERSION_NEW=$3

echo "pushing to master with $MSG"

git add --all .
#git rm -r $(git ls-files --deleted) 
git commit -m "$MSG"
git push origin master

./patch.sh 

npm run dist

./update-readme-api-version.sh $VERSION_CURRENT $VERSION_NEW

git add --all .
#git rm -r $(git ls-files --deleted)
git commit -m "$MSG"
git push origin master

echo "creating tag with $VERSION_NEW"
./tag.sh $VERSION_NEW

