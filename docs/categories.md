# Categories API Documentation

Base URL: `http://localhost:3000/api/category`

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Category

**POST** `/api/category`

Creates a new category for the current user's outlet.

**Request Body:**

```json
{
  "name": "Gaming Consoles"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Gaming Consoles",
    "outlet": {
      "id": "550e8400-e29b-41d4-a716-446655440001"
    },
    "products": [],
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Failed to create category",
  "error": "Category with this name already exists"
}
```

### 2. Get All Categories

**GET** `/api/category`

Retrieves all categories for the current user's outlet with pagination.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:** `GET /api/category?page=1&limit=5`

**Response:**

```json
{
  "success": true,
  "message": "Get all categories success",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Gaming Consoles",
      "outlet": {
        "id": "550e8400-e29b-41d4-a716-446655440001"
      },
      "products": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440003",
          "name": "PlayStation 5",
          "price": 8000000
        }
      ],
      "createdAt": "2024-01-20T10:30:00.000Z",
      "updatedAt": "2024-01-20T10:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "total_page": 1
  }
}
```

### 3. Get Category by ID

**GET** `/api/category/:id`

Retrieves a specific category by ID.

**Path Parameters:**

- `id`: Category UUID

**Response:**

```json
{
  "success": true,
  "message": "Get category success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Gaming Consoles",
    "outlet": {
      "id": "550e8400-e29b-41d4-a716-446655440001"
    },
    "products": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "name": "PlayStation 5",
        "price": 8000000
      }
    ],
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Category not found",
  "error": "Category not found"
}
```

### 4. Update Category

**PATCH** `/api/category/:id`

Updates a category by ID.

**Path Parameters:**

- `id`: Category UUID

**Request Body:**

```json
{
  "name": "Updated Gaming Consoles"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated Gaming Consoles",
    "outlet": {
      "id": "550e8400-e29b-41d4-a716-446655440001"
    },
    "products": [],
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T11:00:00.000Z"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Failed to update category",
  "error": "Category with this name already exists"
}
```

### 5. Delete Category

**DELETE** `/api/category/:id`

Deletes a category by ID.

**Path Parameters:**

- `id`: Category UUID

**Response:**

```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": {
    "message": "Category deleted successfully"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Failed to delete category",
  "error": "Category not found"
}
```

## Field Descriptions

### Create Category Request Body

| Field | Type   | Required | Description                        |
| ----- | ------ | -------- | ---------------------------------- |
| name  | string | Yes      | Category name (max 255 characters) |

### Update Category Request Body

| Field | Type   | Required | Description           |
| ----- | ------ | -------- | --------------------- |
| name  | string | No       | Updated category name |

### Category Response Fields

| Field            | Type              | Description                        |
| ---------------- | ----------------- | ---------------------------------- |
| id               | string (UUID)     | Unique category identifier         |
| name             | string            | Category name                      |
| outlet           | object            | Outlet information                 |
| outlet.id        | string (UUID)     | Outlet identifier                  |
| products         | array             | Array of products in this category |
| products[].id    | string (UUID)     | Product identifier                 |
| products[].name  | string            | Product name                       |
| products[].price | number            | Product price                      |
| createdAt        | string (ISO 8601) | Creation timestamp                 |
| updatedAt        | string (ISO 8601) | Last update timestamp              |

## Business Rules

1. **Outlet Isolation**: Categories are isolated per outlet. Users can only access categories from their own outlet.

2. **Unique Names**: Category names must be unique within the same outlet.

3. **Cascade Deletion**: When a category is deleted, all associated category-product relationships are also deleted.

4. **Product Relationships**: Categories can have multiple products through direct one-to-many relationship. One product can belong to one category or be null.

5. **Validation**: Category names are required and must be non-empty strings with a maximum length of 255 characters.

6. **Permissions**: All operations require appropriate permissions:
   - `category:create` - Create categories
   - `category:read` - View categories
   - `category:update` - Update categories
   - `category:delete` - Delete categories

## Error Codes

- **400 Bad Request**: Invalid request body or missing required fields
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Category not found
- **409 Conflict**: Category name already exists
- **500 Internal Server Error**: Server error

## Notes

- All timestamps are in ISO 8601 format (UTC)
- UUIDs are used for all entity identifiers
- Pagination is available for the "Get All Categories" endpoint
- The `products` relationship shows all products associated with the category
- Categories are automatically associated with the current user's outlet
