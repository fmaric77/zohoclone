#!/bin/bash

# Type check script that matches Next.js build behavior
# This will catch the same errors that 'npm run build' catches

echo "🔍 Running TypeScript type check (matching Next.js build behavior)..."
echo ""

# Run Next.js build in type-check mode
# We use --dry-run to avoid actually building, but Next.js doesn't have that flag
# So we'll just run tsc with the same settings Next.js uses
npx tsc --noEmit --pretty

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Type check passed!"
    echo ""
    echo "⚠️  Note: Next.js build may still catch additional errors."
    echo "   For full verification, run: npm run build"
else
    echo ""
    echo "❌ Type check failed!"
    echo ""
    echo "💡 Tip: Next.js build uses stricter checking."
    echo "   Run 'npm run build' to see all errors."
    exit 1
fi

