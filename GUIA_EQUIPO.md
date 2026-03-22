# Guía de Documentación PBI Docs — Equipo NADRO

## Resumen

Esta guía explica cómo documentar cualquier reporte de Power BI en el sistema PBI Docs usando Claude + el MCP de Power BI Modeling. El proceso toma ~5 minutos por reporte.

---

## Requisitos Previos

1. **Claude** con el **Power BI Modeling MCP** habilitado (la extensión de Chrome o desktop)
2. **Power BI Desktop** instalado
3. **PBI Docs** corriendo en `http://localhost:8000` (o la URL del servidor)
4. El archivo **PROMPT_DOCUMENTACION.md** (incluido en el proyecto)

---

## Proceso Paso a Paso

### 1. Abre el reporte en Power BI Desktop

- Abre el archivo `.pbix` que quieres documentar
- **Importante:** Solo puede haber UN .pbix abierto a la vez (o especifica cuál quieres documentar)
- Espera a que cargue completamente

### 2. Abre Claude y pega el prompt

- Abre una **conversación nueva** en Claude
- Copia todo el contenido del archivo `PROMPT_DOCUMENTACION.md`
- Pégalo como tu primer mensaje
- Claude se conectará automáticamente y empezará a extraer datos

### 3. Responde las preguntas de Claude

Claude te pedirá la info que NO puede extraer del modelo:

| Campo | Qué poner | Ejemplo |
|-------|-----------|---------|
| **Nombre** | Nombre descriptivo del reporte | "Reporte de Ventas Canal Digital" |
| **Área** | Sub-área específica | "Canal Nlinea", "Logística", "Nómina" |
| **Dirección** | Debe ser una de las 6 opciones exactas | "Dir. Ventas" |
| **Descripción** | 1-2 oraciones de qué hace el reporte | "Monitorea ventas diarias del canal..." |
| **Emoji** | Un emoji representativo | 🛒 📦 💰 👥 |
| **Tags** | 3-5 palabras clave separadas por coma | "ventas, digital, databricks" |

### Direcciones válidas (usar EXACTAMENTE así):

- `Dir. Ventas`
- `Dir. Operaciones`
- `Dir. Finanzas`
- `Dir. Recursos Humanos`
- `Dir. Tecnología`
- `Dir. Admon. Inventarios`

### 4. Recibe el JSON

Claude generará un JSON completo con toda la metadata. Tienes dos opciones para ingresarlo:

#### Opción A — Copiar el JSON al archivo (recomendado)

1. Abre `data/reportes.json`
2. Dentro del array `"reportes": [...]`, agrega una coma después del último objeto
3. Pega el JSON nuevo
4. Guarda el archivo
5. Reinicia el servidor

#### Opción B — Usar la API

```bash
curl -X PUT http://localhost:8000/api/reportes/{id-del-reporte} \
  -H "Content-Type: application/json" \
  -d '{...el JSON completo...}'
```

### 5. Sube el PDF del reporte (opcional)

1. En Power BI Desktop: **Archivo → Exportar → Exportar a PDF**
2. En PBI Docs, entra al reporte → pestaña **Vista PDF**
3. Arrastra o selecciona el PDF

---

## Checklist de Calidad

Antes de dar por terminada la documentación, verifica:

- [ ] El nombre es descriptivo y consistente con los demás reportes
- [ ] La dirección es exactamente una de las 6 válidas
- [ ] Las tablas incluyen descripción de qué contienen
- [ ] Las medidas tienen descripción de qué calculan
- [ ] Las relaciones muestran cardinalidad correcta (*:1, 1:1, etc.)
- [ ] La fuente de datos describe el conector y pasos de transformación
- [ ] Los tags son útiles para búsqueda
- [ ] (Opcional) Se subió el PDF del reporte

---

## Troubleshooting

### "No se encontraron instancias locales"
→ Verifica que Power BI Desktop esté abierto con el .pbix cargado

### "Error al conectar"
→ Cierra y vuelve a abrir Power BI Desktop, luego reintenta

### "El JSON no se ve en la app"
→ Verifica que reiniciaste el servidor después de editar reportes.json

### "El diagrama no muestra las relaciones"
→ Verifica que los nombres de tabla en `relations` coinciden exactamente con los de `tables`

---

## Contacto

Si tienes dudas sobre el proceso, contacta al equipo de Datos y BI.
