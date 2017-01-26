.PHONY: run in stop clean build

run:
	docker-compose run --rm dev

in:
	docker exec -i -t $(shell docker-compose ps | grep run | cut -d" " -f 1) /bin/bash

stop:
	docker-compose stop

clean:
	docker-compose down
	docker volume rm $(docker volume ls -qf dangling=true)

build:
	sh ./docker/dockerfile-ids.sh
	docker-compose build dev
