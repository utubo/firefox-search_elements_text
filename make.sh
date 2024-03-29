#!/usr/bin/sh

SCRIPT_DIR=$(cd $(dirname $0); pwd)
cd $SCRIPT_DIR/src
zip -r ../search_elements_text.zip *
cd ..
mv -f search_elements_text.zip search_elements_text.xpi

