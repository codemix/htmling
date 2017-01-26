#!/bin/bash
DOCKER_DIR=$(dirname $(readlink -f "$0"))
sed -i "s/ENV\ PERM_USER_ID\ 1000/ENV\ PERM_USER_ID\ $(id -u)/g" $DOCKER_DIR/Dockerfile
sed -i "s/ENV\ PERM_GROUP_ID\ 1000/ENV\ PERM_GROUP_ID\ $(id -g)/g" $DOCKER_DIR/Dockerfile
