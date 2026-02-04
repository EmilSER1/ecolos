#!/bin/bash
cd "$(dirname "$0")"

# Try to find node
if command -v node &> /dev/null; then
    NODE_CMD=node
elif [ -f "/usr/local/bin/node" ]; then
    NODE_CMD="/usr/local/bin/node"
elif [ -f "/opt/homebrew/bin/node" ]; then
    NODE_CMD="/opt/homebrew/bin/node"
elif [ -d "$HOME/.nvm" ]; then
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    NODE_CMD=node
else
    echo "Node.js not found. Please install Node.js first."
    exit 1
fi

# Try npm or bun
if command -v bun &> /dev/null; then
    echo "Starting with bun..."
    bun install && bun run dev
elif command -v npm &> /dev/null; then
    echo "Starting with npm..."
    npm install && npm run dev
else
    echo "No package manager found. Please install npm or bun."
    exit 1
fi
