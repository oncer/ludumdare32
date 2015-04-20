#!/bin/sh

TARGET=/d/Users/Simon/Dropbox/Public/PebblesBakery

mkdir -p "$TARGET"
cp PebblesBakery/index.html PebblesBakery/main.js PebblesBakery/project.json "$TARGET/"
cp -r PebblesBakery/res "$TARGET/"
cp -r PebblesBakery/src "$TARGET/"
mkdir -p "$TARGET/frameworks"
cp -r PebblesBakery/frameworks/cocos2d-html5 "$TARGET/frameworks/"
