#!/bin/sh

TARGET=/d/Users/Simon/Dropbox/Public/PebblesBakery

cd PebblesBakery
cocos compile -p web -m release

mkdir -p "$TARGET"
cp -r publish/html5/* "$TARGET/"

cd ..
