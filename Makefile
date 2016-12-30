NAME=xogroup/bunnybus
VERSION=latest

test:
	node_modules/.bin/lab test -a code -L

debug-test:
	@mocha --debug-brk --recursive -w

clean:
	@rm -f npm-shrinkwrap.json
	@rm -rf ./node_modules
	npm install --production
	npm prune
	shonkwrap

install:
	@rm -rf ./node_modules
	npm install

docker-build:
	@docker build -t $(NAME):4 -f docker/Dockerfile.node-4 .
	@docker build -t $(NAME):6 -f docker/Dockerfile.node-6 .

run: docker-build
	@docker-compose -f docker/docker-compose.yml run --rm module-node-4
	@docker-compose -f docker/docker-compose.yml run --rm module-node-6  

run-debug-test: docker-build
	@docker-compose -f docker/docker-compose.yml run --service-ports --rm pluginDebug

jenkins-run: docker-build
	docker-compose -f docker/docker-compose.yml run --rm pluginJenkins

jenkins-build:
	make jenkins-cover && \
	gulp build

jenkins-cover:
	istanbul cover _mocha -- --debug --recursive

lint:
	node_modules/.bin/eslint --fix src/ test/

.PHONY: test debug-test clean install docker-build run run-debug-test jenkins-run jenkins-build jenkins-cover lint