# Why Type-Check Doesn't Catch All Errors

## The Problem

Running `npm run type-check` (which uses `tsc --noEmit`) **does NOT catch the same errors** that `npm run build` catches. This is why you're seeing TypeScript errors during deployment that weren't caught locally.

## Root Causes

### 1. **Next.js Uses SWC/Turbopack**
- Next.js 16 uses **SWC** (Speedy Web Compiler) and **Turbopack** for compilation
- These tools have their own TypeScript type checking that's **stricter** than standalone `tsc`
- They catch errors that `tsc --noEmit` misses

### 2. **Module Resolution Differences**
- Your `tsconfig.json` uses `"moduleResolution": "bundler"` (required for Next.js)
- This is a newer option that `tsc` doesn't fully support for type checking
- Next.js build process handles this differently

### 3. **Prisma Type Resolution**
- Prisma generates types that are better resolved during Next.js build
- `tsc --noEmit` might not fully resolve Prisma types in all contexts
- Next.js build has better integration with Prisma types

### 4. **Incremental Build Cache**
- Next.js uses incremental builds and caches
- During build, it checks types more thoroughly than `tsc --noEmit`

## The Solution

**Always run `npm run build` before deploying** - this is the only way to catch all TypeScript errors that Next.js will catch.

### Recommended Workflow

1. **During Development:**
   ```bash
   npm run dev  # Fast, but may miss some type errors
   ```

2. **Before Committing:**
   ```bash
   npm run build  # Catches all TypeScript errors
   ```

3. **In CI/CD:**
   ```bash
   npm run build  # Must pass before deployment
   ```

### Alternative: Enhanced Type-Check Script

You can create a script that runs a partial build:

```bash
# This will catch most errors but is slower
npm run build -- --no-lint
```

## Why This Happens

The TypeScript compiler (`tsc`) and Next.js build process use **different type checking engines**:

- **`tsc`**: Standalone TypeScript compiler (what `type-check` uses)
- **Next.js Build**: Uses SWC + Turbopack with enhanced type checking

They're not 100% compatible, so errors can slip through.

## Best Practice

**Treat `npm run build` as your source of truth** for TypeScript errors, not `npm run type-check`.

