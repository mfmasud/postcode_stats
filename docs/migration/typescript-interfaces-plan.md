# TypeScript Interfaces/Types Creation Plan

## Overview

This document outlines the plan for creating efficient TypeScript interfaces and types for the remaining Koa-to-Fastify migration tasks. The focus is on creating type-safe definitions for the Postcodes and Search APIs to enable proper Fastify plugin development.

## Current Migration Status

### ✅ Completed Components
- User API (Fastify plugin with TypeScript schemas)
- Authentication system
- Database models (Postcode, Search, User, etc.)
- Core utilities and helpers

### ❌ Remaining Tasks
- **Postcodes Routes**: `src/routes/postcodes.js` (Koa) → Fastify plugin
- **Search Routes**: `src/routes/search.js` (Koa) → Fastify plugin
- **Postcodes Plugin**: `src/plugins/postcodes/`
- **Search Plugin**: `src/plugins/search/`
- **Postcodes API Schemas**: TypeScript schemas for postcodes endpoints
- **Search API Schemas**: TypeScript schemas for search endpoints

## API Analysis

### Postcodes API Endpoints

Based on `src/routes/postcodes.js` analysis:

1. **GET /api/v1/postcodes/** - Get all postcodes (admin only)
   - Response: Array of postcode documents
   - Auth: Required (admin ability: "readAll" "Postcode")

2. **GET /api/v1/postcodes/random** - Get random postcode
   - Response: Single postcode document
   - Auth: Required (user ability: "read" "Postcode")

3. **GET /api/v1/postcodes/:postcode** - Get specific postcode
   - Params: `postcode` (string)
   - Response: Single postcode document
   - Auth: Required (user ability: "read" "Postcode")

### Search API Endpoints

Based on `src/routes/search.js` analysis:

1. **GET /api/v1/search/?latitude=X&longitude=Y** - Search by coordinates
   - Query params: `latitude` (number), `longitude` (number)
   - Response: Search document with populated relations
   - Auth: Required (user ability: "create" "Search")

2. **POST /api/v1/search/** - Search by postcode
   - Body: `{ postcode: string }`
   - Response: Search document with populated relations
   - Auth: Required (user ability: "create" "Search")

3. **GET /api/v1/search/random** - Random search (admin only)
   - Response: Search document with populated relations
   - Auth: Required (user ability: "create" "RandomSearch")

## Type Creation Strategy

### 1. Core API Types (`src/types/`)

Create modular type files following existing patterns:

#### `src/types/postcodes.ts`
```typescript
// Response types for postcodes endpoints
export interface GetAllPostcodesResponse { postcodes: PostcodeDoc[] }
export interface GetRandomPostcodeResponse { postcode: PostcodeDoc }
export interface GetPostcodeResponse { postcode: PostcodeDoc }

// Parameter types
export interface PostcodeParams { postcode: string }

// Error types
export interface PostcodeErrorResponse { message: string; statusCode: number }
```

#### `src/types/search.ts`
```typescript
// Request types
export interface SearchByCoordinatesQuery {
  latitude: number;
  longitude: number;
}

export interface SearchByPostcodeBody {
  postcode: string;
}

// Response types (reuse SearchDoc from models)
export interface SearchResponse { search: SearchDoc }

// Error types
export interface SearchErrorResponse { message: string; statusCode: number }
```

### 2. TypeScript Schemas (`src/schemas/`)

Convert existing JSON schemas and create new ones using TypeBox:

#### `src/schemas/postcodesSchema.ts`
- `GetAllPostcodesSchema` - GET /api/v1/postcodes/
- `GetRandomPostcodeSchema` - GET /api/v1/postcodes/random
- `GetPostcodeSchema` - GET /api/v1/postcodes/:postcode

#### `src/schemas/searchSchema.ts`
- `SearchByCoordinatesSchema` - GET /api/v1/search/
- `SearchByPostcodeSchema` - POST /api/v1/search/
- `SearchRandomSchema` - GET /api/v1/search/random

#### `src/schemas/commonSchema.ts` (extend existing)
- Convert `latlong.json` to TypeScript using TypeBox
- Add coordinate validation schema

## Implementation Steps

### Phase 1: Type Definitions
1. Create `src/types/postcodes.ts` with comprehensive API types
2. Create `src/types/search.ts` with comprehensive API types
3. Update `src/types/index.ts` to export all new types (if it exists)

### Phase 2: Schema Creation
1. Create `src/schemas/postcodesSchema.ts` using TypeBox
2. Create `src/schemas/searchSchema.ts` using TypeBox
3. Convert `src/schemas/latlong.json` to TypeScript in `commonSchema.ts`

### Phase 3: Integration Preparation
1. Ensure all types are properly exported
2. Verify type compatibility with existing models
3. Test type inference with sample usage

## Quality Assurance

### Type Safety Checks
- [ ] All interfaces use explicit types (no `any`)
- [ ] Proper generic type parameters where applicable
- [ ] Interface-driven contracts for API boundaries
- [ ] Type guards for runtime validation where needed

### Completeness
- [ ] All API endpoints have corresponding request/response types
- [ ] Error response types defined for each endpoint
- [ ] Parameter types match route definitions
- [ ] Types align with existing Mongoose model types

### Performance & Maintainability
- [ ] Modular type organization (separate files per domain)
- [ ] Reusable common types (coordinate, error response, etc.)
- [ ] Clear naming conventions following existing codebase
- [ ] Comprehensive JSDoc comments for all types

## Dependencies

### Existing Dependencies (Leverage)
- `@sinclair/typebox` - For TypeScript schema definitions
- `mongoose` - For model type inference
- Existing model types (`PostcodeDoc`, `SearchDoc`, etc.)

### No New Dependencies Required
All type creation can be done with existing packages and native TypeScript features.

## Risk Assessment

### Low Risk
- Type-only changes don't affect runtime behavior
- Can be developed incrementally
- Easy to test with TypeScript compiler
- Reversible (types can be removed if needed)

### Mitigation Strategies
- Use `--noEmit` TypeScript checks during development
- Create types in separate files to avoid breaking existing code
- Test compilation after each phase
- Keep types focused and minimal initially

## Success Criteria

1. **Type Coverage**: All postcodes and search API endpoints have complete type definitions
2. **Compilation**: TypeScript compilation passes without errors
3. **Integration Ready**: Types are ready for use in Fastify plugin development
4. **Documentation**: All types have clear JSDoc comments explaining their purpose
5. **Consistency**: Types follow existing codebase patterns and conventions

## Next Steps

After completing this task, the following migration work can proceed:

1. **Fastify Plugin Development**: Use the created types to build type-safe plugins
2. **Route Handler Implementation**: Implement handlers with proper type checking
3. **Schema Validation**: Apply TypeBox schemas to Fastify routes
4. **Testing**: Create tests using the defined types

This plan ensures efficient, type-safe development of the remaining migration components.
