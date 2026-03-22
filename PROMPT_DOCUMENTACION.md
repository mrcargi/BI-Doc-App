# ════════════════════════════════════════════════════════════════════
# PROMPT PARA DOCUMENTAR REPORTES PBI — Copiar y pegar en Claude
# ════════════════════════════════════════════════════════════════════
# INSTRUCCIONES: Copia todo este bloque de texto y pégalo como primer
# mensaje en una conversación nueva de Claude (que tenga el MCP de
# Power BI Modeling conectado). Luego sigue las instrucciones.
# ════════════════════════════════════════════════════════════════════

Necesito que me ayudes a documentar un reporte de Power BI extrayendo toda la metadata del modelo semántico. Tengo el archivo .pbix abierto en Power BI Desktop.

## Tu objetivo

Conectarte al modelo, extraer TODA la metadata y generar un JSON en el formato exacto de PBI Docs. No omitas ninguna tabla, columna, medida o relación.

## Proceso paso a paso

### PASO 1 — Conectar
Ejecuta `ListLocalInstances` para encontrar mi instancia de Power BI Desktop y conéctate automáticamente.

### PASO 2 — Extraer metadata
Ejecuta estas operaciones en orden:
1. `table_operations` → `List` (todas las tablas con su tipo, columnas count)
2. `column_operations` → `List` (todas las columnas de todas las tablas, con tipo de dato)
3. `relationship_operations` → `List` (todas las relaciones)
4. `measure_operations` → `List` (todas las medidas con displayFolder y descripción)
5. `partition_operations` → `List` (para identificar tipo de tabla: import/calc/etc y fuente)

### PASO 3 — Pedirme información contextual
Después de extraer, pregúntame SOLO estos datos que NO puedes obtener del modelo:
- Nombre descriptivo del reporte
- Área (ej: Canal Nlinea, Logística, Nómina, etc.)
- Dirección (DEBE ser una de estas exactas):
  - Dir. Ventas
  - Dir. Operaciones
  - Dir. Finanzas
  - Dir. Recursos Humanos
  - Dir. Tecnología
  - Dir. Admon. Inventarios
- Descripción breve del reporte (1-2 oraciones)
- Emoji representativo (📊🛒📦💰👥🏭 etc.)
- Tags relevantes (ventas, nlinea, logística, etc.)
- Responsable (opcional)

### PASO 4 — Generar el JSON
Con toda la info, genera el JSON completo en este formato EXACTO:

```json
{
  "id": "nombre-en-minusculas-con-guiones",
  "name": "Nombre Descriptivo del Reporte",
  "area": "Nombre del Área",
  "direccion": "Dir. Exacta",
  "desc": "Descripción breve...",
  "responsable": "",
  "estado": "activo",
  "tags": ["tag1", "tag2"],
  "compat": "1567",
  "color": "#5C9868",
  "emoji": "📊",
  "pdfFile": null,
  "createdAt": "YYYY-MM-DD",
  "updatedAt": "YYYY-MM-DD",
  "tables": [
    {
      "name": "NombreTabla",
      "type": "import|calc|empty|param",
      "cols": 36,
      "rows": "millones|miles|decenas|dinámica|pocos|—",
      "desc": "Descripción de qué contiene la tabla"
    }
  ],
  "relations": [
    {
      "fromTable": "TablaOrigen",
      "fromCol": "ColumnaFK",
      "toTable": "TablaDestino",
      "toCol": "ColumnaPK",
      "card": "*:1",
      "dir": "OneDirection|BothDirections",
      "active": true
    }
  ],
  "columns": [
    {
      "n": "NombreColumna",
      "t": "Texto|Entero|Decimal|Fecha/Hora|Calculada",
      "d": "Descripción de la columna"
    }
  ],
  "folders": [
    {
      "name": "NombreCarpeta",
      "color": "#5C9868",
      "measures": [
        {
          "n": "NombreMedida",
          "d": "Descripción de qué calcula la medida"
        }
      ]
    }
  ],
  "source": {
    "connector": "Tipo de conector (SharePoint, Databricks, SQL Server, etc.)",
    "url": "URL o servidor de conexión",
    "folder": "Ruta o base de datos",
    "fileType": "CSV|Excel|Delta Table|SQL Query|etc.",
    "mode": "Import|DirectQuery|Dual",
    "api": "Versión o tipo de API",
    "user": "Cuenta de servicio o método de auth",
    "steps": [
      "Paso 1 de transformación en Power Query",
      "Paso 2...",
      "Paso 3..."
    ]
  }
}
```

### Reglas para mapear tipos de datos:
- `String` → `"Texto"`
- `Int64`, `Whole Number` → `"Entero"`
- `Double`, `Decimal`, `Currency` → `"Decimal"`
- `DateTime`, `Date` → `"Fecha/Hora"`
- Columnas con `expression` (calculated columns) → `"Calculada"`

### Reglas para tipo de tabla:
- Partición tipo `M` (Power Query) → `"import"`
- Partición tipo `Calculated` o tablas DAX → `"calc"`
- Tablas sin filas que solo contienen medidas → `"empty"`
- Tablas con pocas filas hardcodeadas (DATATABLE, parámetros) → `"param"`

### Reglas para carpetas de medidas:
- Agrupa las medidas por su `displayFolder`
- Si no tienen displayFolder, agrúpalas en "General"
- Asigna colores distintos a cada carpeta:
  - "#5C9868" (verde), "#4a7cb5" (azul), "#7c5cbf" (morado)
  - "#c48a1a" (dorado), "#b85c44" (rojo), "#6a8c6e" (verde olivo)
  - "#2d4a6e" (azul oscuro)

### Reglas para filas aproximadas (rows):
- Si puedes ejecutar un COUNTROWS vía DAX, usa el resultado
- Si no: tablas de hechos grandes → "millones", dimensiones → "miles", catálogos → "decenas", calculadas → "dinámica", parámetros → "pocos", vacías → "—"

### PASO 5 — Entregar
Dame el JSON completo listo para que lo copie y pegue. Adicionalmente, dame el comando curl o la instrucción para insertarlo en la API:

```
POST http://localhost:8000/api/reportes/{id}
Content-Type: application/json
```

## IMPORTANTE
- Las columnas del JSON solo deben ser las de la tabla PRINCIPAL (fact table), no de todas las tablas
- Genera descripciones útiles para cada medida basándote en su expresión DAX
- Para la fuente de datos, examina las particiones M para entender el conector
- No incluyas tablas internas de Power BI (LocalDateTable, DateTableTemplate, etc.)
