#!/bin/bash

if [ "$(npm view $(cut -d "=" -f 2 <<< $(npm run env | grep "npm_package_name")) version)" == "$(cut -d "=" -f 2 <<< $(npm run env | grep "npm_package_version"))" ]; then echo true; else echo false; fi
