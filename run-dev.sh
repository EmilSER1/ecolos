#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

cd "$(dirname "$0")"

echo "Checking Node.js..."
node --version
npm --version

echo "Installing dependencies..."
npm install

echo "Starting dev server..."
npm run dev