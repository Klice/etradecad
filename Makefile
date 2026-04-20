.PHONY: install start build preview test test-watch clean

install:
	npm install

start:
	npm start

build:
	npm run build

preview:
	npm run preview

test:
	npm test

test-watch:
	npm run test:watch

clean:
	rm -rf dist node_modules
