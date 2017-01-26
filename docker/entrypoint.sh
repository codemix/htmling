#!/bin/bash

if [ ! -d /htmling/app/node_modules ]
then
  OLD_PATH=$PWD

  cd /htmling/app
  npm install

  cd $OLD_PATH
fi

echo ""
echo "-----------------------------"
echo "Virtual Machine ready to work"
echo "-----------------------------"
echo ""

exec "$@"
