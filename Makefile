default:
	@echo "No default task"

lint:
	@./node_modules/.bin/xo

.PHONY: test lint
