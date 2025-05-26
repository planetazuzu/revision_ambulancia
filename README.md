# AmbuReview - Ambulance Management System

This is a Next.js application for managing ambulance reviews, cleaning logs, and inventory, built within Firebase Studio.

## Getting Started

To get started, explore the application structure, particularly `src/app/page.tsx` (Login Page) and the dashboard pages under `src/app/dashboard/`.

## Data Management

This application currently uses a **mock data layer**.
- Ambulance-specific data (details, mechanical reviews, cleaning logs, on-board inventory) is managed client-side via React Context (`src/contexts/AppDataContext.tsx`). This data is initialized with sample values and persists only for the duration of the browser session.
- The "Ampulario" (central medical supply inventory) feature uses **server-side in-memory storage** (`src/lib/ampularioStore.ts`) accessed via Next.js API Routes. This data is also reset when the server restarts.

**No external database is configured for this prototype.**

## Key Features

-   User Authentication (mocked)
-   Ambulance Management
-   Sequential Workflow for ambulance checks:
    1.  Mechanical Review
    2.  Cleaning Log
    3.  Inventory Check (on-board supplies)
-   **Ampulario (Central Inventory)**:
    -   Manage a central stock of medical supplies.
    -   Import supplies via CSV.
    -   Track expiry dates.
-   System Alerts (in-app):
    -   Pending ambulance tasks.
    -   Expiry alerts for on-board ambulance supplies.
    -   Expiry alerts for Ampulario supplies.

## API Endpoints (for Ampulario)

The following API endpoints are available for managing Ampulario materials:

-   **`POST /api/ampulario/import`**
    -   Description: Imports materials from a CSV file into a specified space in the Ampulario.
    -   Request Body: `multipart/form-data` with a `file` field containing the CSV.
    -   CSV Columns: `name, dose, unit, quantity, route, expiry_date, space_id`
        -   `name` (string, required): Name of the material.
        -   `dose` (string, optional): Dosage information.
        -   `unit` (string, optional): Unit for the dose.
        -   `quantity` (integer, required): Quantity, must be >= 0.
        -   `route` (enum, required): Administration route. Valid values: "IV/IM", "Nebulizador", "Oral".
        -   `expiry_date` (date string, optional): Expiry date (e.g., "YYYY-MM-DD", "DD/MM/YYYY").
        -   `space_id` (string, required): ID of the space where the material is stored (e.g., "space23").
    -   Response: `{ "imported": N }` where N is the number of successfully imported materials.
    -   Example CSV (`ampulario_example.csv`):
        ```csv
        name,dose,unit,quantity,route,expiry_date,space_id
        Adrenalina 1mg/1ml,1,mg/ml,10,IV/IM,2025-12-31,space23
        Salbutamol Neb.,5,mg,20,Nebulizador,2024-10-01,space23
        Paracetamol 500mg,500,mg,100,Oral,,space23
        Diazepam 10mg,10,mg,5,IV/IM,2025-06-30,space23
        ```

-   **`GET /api/materials?spaceId=<ID>&routeName=<ROUTE>&nameQuery=<QUERY>`**
    -   Description: Retrieves a list of Ampulario materials. All query parameters are optional.
    -   `spaceId` (string, optional): Filter by space ID.
    -   `routeName` (string, optional): Filter by material route ("IV/IM", "Nebulizador", "Oral").
    -   `nameQuery` (string, optional): Filter by name (case-insensitive substring match).
    -   Response: Array of `AmpularioMaterial` objects.

-   **`POST /api/materials`**
    -   Description: Adds a new single material to the Ampulario.
    -   Request Body (JSON): `AmpularioMaterial` object (excluding `id`, `created_at`, `updated_at`).
    -   Response: The created `AmpularioMaterial` object.

-   **`GET /api/materials/[id]`**
    -   Description: Retrieves a specific Ampulario material by its ID.
    -   Response: The `AmpularioMaterial` object or 404 if not found.

-   **`PUT /api/materials/[id]`**
    -   Description: Updates an existing Ampulario material.
    -   Request Body (JSON): Partial `AmpularioMaterial` object with fields to update (e.g., `quantity`, `expiry_date`).
    -   Response: The updated `AmpularioMaterial` object or 404 if not found.

-   **`DELETE /api/materials/[id]`**
    -   Description: Deletes an Ampulario material by its ID.
    -   Response: Success message or 404 if not found.

-   **`GET /api/ampulario/alerts?spaceId=<ID>`**
    -   Description: Retrieves expiry alerts for Ampulario materials.
    -   `spaceId` (string, optional): Filter alerts for a specific space. If omitted, returns alerts for all spaces.
    -   Response: Array of `Alert` objects related to Ampulario material expiry.

## Future Development

For a production application, the mock data layer and in-memory store would be replaced with a persistent database (e.g., PostgreSQL, Firestore) and corresponding backend services. Cron jobs for alerts would be set up using a task scheduler.
