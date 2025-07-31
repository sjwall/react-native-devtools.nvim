#!/bin/sh

npm i -g neovim
npm install
npx esbuild src/index.ts --bundle --platform=node --outfile=rplugin/node/index.js --format=cjs
npx esbuild src/dap/reactNativeDebug.ts --bundle --platform=node --outfile=dist/reactNativeDebug.js --format=cjs
