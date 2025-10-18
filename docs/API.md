# API Route Map

| Method | Endpoint | Params | Body | Auth Level | Notes |
|--------|----------|--------|------|------------|-------|
| **Special/Auth Routes** |
| GET | `/login` | Query: `id` (string) | - | none | Returns JWT token |
| GET | `/private` | - | - | standard | Returns authenticated user details |
| **User Routes** |
| POST | `/users` | - | `username` (string)<br>`password` (string)<br>`email` (string) | none | Registration - anyone can create |
| GET | `/users` | - | - | admin | View all users (readAll permission) |
| GET | `/users/:id` | Param: `id` (numeric string) | - | standard | Users read own; admins read all |
| PUT | `/users/:id` | Param: `id` (numeric string) | `firstName?` (string)<br>`lastName?` (string)<br>`about?` (string)<br>`password?` (string)<br>`email?` (string) | standard | Users update own; admins update all |
| DELETE | `/users/:id` | Param: `id` (numeric string) | - | standard | Users delete own; admins delete any |
| **Postcode Routes** |
| GET | `/postcodes` | - | - | admin | View all postcodes (readAll permission) |
| GET | `/postcodes/random` | - | - | standard | Retrieve random postcode |
| GET | `/postcodes/:postcode` | Param: `postcode` (UK postcode format) | - | none | Anyone can search specific postcode |
| **Search Routes** |
| GET | `/search` | Query: `latitude` (number, -90 to 90)<br>`longitude` (number, -180 to 180) | - | none | Geospatial search via coordinates |
| POST | `/search` | - | `postcode` (string, UK format) | none | Search via postcode |
| GET | `/search/random` | - | - | admin | Random postcode search (testing only) |

## Auth Levels

- **none**: No authentication required (unauthenticated users)
- **standard**: Requires JWT authentication (`user`, `paiduser`, or `admin` roles)
- **admin**: Requires admin role specifically

## Role Hierarchy

1. `none` - Unauthenticated users
2. `user` - Standard authenticated users
3. `paiduser` - Paid users (same permissions as `user` for most routes)
4. `admin` - Administrator with elevated permissions
