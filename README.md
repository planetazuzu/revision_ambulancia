
# AmbuReview - Sistema de Gestión de Ambulancias

Esta es una aplicación Next.js para gestionar revisiones de ambulancias, registros de limpieza e inventario, construida con Firebase Studio.

## Para Empezar

Para comenzar, explora la estructura de la aplicación, particularmente `src/app/page.tsx` (Página de Inicio de Sesión) y las páginas del panel de control bajo `src/app/dashboard/`.

## Gestión de Datos

Actualmente, esta aplicación utiliza una **capa de datos de demostración (mock)**.
- Los datos específicos de las ambulancias (detalles, revisiones mecánicas, registros de limpieza, inventario a bordo, revisiones diarias) se gestionan en el lado del cliente mediante React Context (`src/contexts/AppDataContext.tsx`). Estos datos se inicializan con valores de ejemplo y persisten solo durante la sesión del navegador.
- La funcionalidad **"Gestión de Materiales" (Inventario Central)** utiliza **almacenamiento en memoria del lado del servidor** (`src/lib/ampularioStore.ts`) accesible mediante Rutas API de Next.js. Estos datos también se restablecen cuando el servidor se reinicia.

**No hay una base de datos externa configurada para este prototipo.**

## Características Clave

- Autenticación de Usuarios (simulada con roles "coordinador" y "usuario").
- Flujo de validación de ambulancia para usuarios al iniciar turno.
- Gestión de Ambulancias (visible según rol).
- Flujo de Trabajo Secuencial para revisiones de ambulancias:
    1. Revisión Mecánica
    2. Registro de Limpieza
    3. Control de Inventario (suministros a bordo)
- Formulario de Revisión Diaria del Vehículo.
- **Gestión de Materiales (Inventario Central)**:
    - Gestionar un stock central de suministros médicos y espacios de almacenamiento.
    - Importar suministros mediante CSV a un espacio específico.
    - Rastrear fechas de caducidad.
    - Interfaz para gestionar espacios de almacenamiento.
- Alertas del Sistema (en la aplicación):
    - Tareas pendientes de ambulancias.
    - Alertas de caducidad para suministros a bordo de ambulancias.
    - Alertas de caducidad para suministros del Inventario Central.
- Modo Claro/Oscuro.
- Funcionalidad PWA básica.

## Endpoints API

Los siguientes endpoints API están disponibles (la base `/api/ampulario/...` se mantiene por razones técnicas, pero conceptualmente gestiona el "Inventario Central"):

### Gestión de Materiales (Inventario Central) y Materiales

- **`POST /api/ampulario/import`**
    - Descripción: Importa materiales desde un archivo CSV a un espacio específico en el Inventario Central.
    - Cuerpo de la Solicitud: `multipart/form-data` con un campo `file` conteniendo el CSV.
    - Columnas del CSV: `name, dose, unit, quantity, route, expiry_date, space_id`
        - `name` (string, obligatorio): Nombre del material.
        - `dose` (string, opcional): Información de la dosis.
        - `unit` (string, opcional): Unidad para la dosis.
        - `quantity` (entero, obligatorio): Cantidad, debe ser >= 0.
        - `route` (enum, obligatorio): Vía de administración. Valores válidos: "IV/IM", "Nebulizador", "Oral".
        - `expiry_date` (string de fecha, opcional): Fecha de caducidad (ej., "AAAA-MM-DD", "DD/MM/AAAA").
        - `space_id` (string, obligatorio): ID del espacio donde se almacena el material (ej., "space23").
    - Respuesta: `{ "imported": N }` donde N es el número de materiales importados con éxito.
    - Ejemplo de CSV (`ampulario_example.csv` - el nombre del archivo de ejemplo se mantiene):
        ```csv
        name,dose,unit,quantity,route,expiry_date,space_id
        Adrenalina 1mg/1ml,1,mg/ml,10,IV/IM,2025-12-31,space23
        Salbutamol Neb.,5,mg,20,Nebulizador,2024-10-01,space23
        Paracetamol 500mg,500,mg,100,Oral,,space23
        Diazepam 10mg,10,mg,5,IV/IM,2025-06-30,space23
        ```

- **`GET /api/materials?spaceId=<ID>&routeName=<ROUTE>&nameQuery=<QUERY>`**
    - Descripción: Obtiene una lista de materiales del Inventario Central. Todos los parámetros de consulta son opcionales.
    - `spaceId` (string, opcional): Filtrar por ID de espacio.
    - `routeName` (string, opcional): Filtrar por vía del material ("IV/IM", "Nebulizador", "Oral").
    - `nameQuery` (string, opcional): Filtrar por nombre (coincidencia de subcadena insensible a mayúsculas).
    - Respuesta: Array de objetos `AmpularioMaterial`.

- **`POST /api/materials`**
    - Descripción: Añade un nuevo material único al Inventario Central.
    - Cuerpo de la Solicitud (JSON): Objeto `AmpularioMaterial` (excluyendo `id`, `created_at`, `updated_at`).
    - Respuesta: El objeto `AmpularioMaterial` creado.

- **`GET /api/materials/[id]`**
    - Descripción: Obtiene un material específico del Inventario Central por su ID.
    - Respuesta: El objeto `AmpularioMaterial` o 404 si no se encuentra.

- **`PUT /api/materials/[id]`**
    - Descripción: Actualiza un material existente del Inventario Central.
    - Cuerpo de la Solicitud (JSON): Objeto `AmpularioMaterial` parcial con los campos a actualizar (ej., `quantity`, `expiry_date`).
    - Respuesta: El objeto `AmpularioMaterial` actualizado o 404 si no se encuentra.

- **`DELETE /api/materials/[id]`**
    - Descripción: Elimina un material del Inventario Central por su ID.
    - Respuesta: Mensaje de éxito o 404 si no se encuentra.

- **`GET /api/ampulario/alerts`**
    - Descripción: Obtiene alertas de caducidad para materiales del Inventario Central.
    - `spaceId` (string, opcional): Filtrar alertas para un espacio específico. Si se omite, devuelve alertas para todos los espacios.
    - Respuesta: Array de objetos `Alert` relacionados con la caducidad de materiales del Inventario Central.

### Espacios del Inventario Central

- **`GET /api/spaces`**
    - Descripción: Obtiene una lista de todos los espacios de almacenamiento del Inventario Central.
    - Respuesta: Array de objetos `Space`.

- **`POST /api/spaces`**
    - Descripción: Crea un nuevo espacio de almacenamiento.
    - Cuerpo de la Solicitud (JSON): `{ "name": "Nombre del Espacio" }`.
    - Respuesta: El objeto `Space` creado.

- **`GET /api/spaces/[id]`**
    - Descripción: Obtiene un espacio específico por su ID.
    - Respuesta: El objeto `Space` o 404 si no se encuentra.

- **`PUT /api/spaces/[id]`**
    - Descripción: Actualiza un espacio existente.
    - Cuerpo de la Solicitud (JSON): `{ "name": "Nuevo Nombre del Espacio" }`.
    - Respuesta: El objeto `Space` actualizado o 404 si no se encuentra.

- **`DELETE /api/spaces/[id]`**
    - Descripción: Elimina un espacio por su ID. Solo se puede eliminar si no está en uso por ningún material.
    - Respuesta: Mensaje de éxito o error si no se encuentra o está en uso.

## Desarrollo Futuro

Para una aplicación de producción, la capa de datos de demostración y el almacén en memoria se reemplazarían con una base de datos persistente (ej., PostgreSQL, Firestore) y los servicios de backend correspondientes. Los trabajos cron para alertas se configurarían utilizando un programador de tareas.
