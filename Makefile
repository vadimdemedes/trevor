SRC = index.js

default:
	@echo "No default task"

test:
	@./node_modules/.bin/ava

include node_modules/make-lint/index.mk

.PHONY: test
