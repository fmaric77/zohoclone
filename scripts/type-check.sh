#!/bin/bash

# Type check script that matches Next.js build behavior
# This will catch the same errors that 'npm run build' catches

echo "🔍 Running TypeScript type check (matching Next.js build behavior)..."
echo ""

# Clear .next to ensure fresh type checking
rm -rf .next

# Run Next.js build which does full type checking
# We'll stop after type checking by checking the output
echo "Running Next.js build for type checking..."
npx next build --debug 2>&1 | tee /tmp/next-build.log

BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Type check passed!"
else
    echo ""
    echo "❌ Type check failed!"
    echo ""
    echo "Errors found:"
    grep -E "(error TS|Type error)" /tmp/next-build.log | head -20
    exit 1
fi

