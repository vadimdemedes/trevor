default:
	@echo "No default task"

test:
	@./node_modules/.bin/ava

.PHONY: test
