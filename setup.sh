#!/bin/bash

echo "🚀 DeFi Protocol - Complete Setup Guide"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Backend Setup
echo "📦 Setting up Backend..."
npm install

echo ""
echo "📝 Compiling Contracts..."
npm run compile

echo ""
echo "🚀 Deploying Contracts..."
npm run deploy

echo ""
echo "✅ Backend setup complete!"
echo ""
echo "⚠️  Keep this terminal running for Hardhat network"
echo "Next: Open a new terminal and run the frontend setup"
echo ""
echo "📝 To start frontend:"
echo "   cd frontend"
echo "   npm install"
echo "   npm start"
