# Metaprompt para Omni — Cambios en Airtable para la versión simplificada de JJS

## Contexto

Ya existe una base de Airtable llamada **"JJS — Marketplace"** con tablas **Leads**, **Maestros**, **Cotizaciones**, **Mensajes**, **Pagos** y **Reseñas**. **No crees la base de nuevo ni borres nada existente.** Esta tarea es solo agregar los campos y opciones nuevas que necesita la versión simplificada del producto (flujo de "un tap para aceptar", chat con cotización integrada, pago con comisión del 10%).

---

## INSTRUCCIONES PARA OMNI

### 1. Tabla `Maestros` — agregar un campo

| Nombre del campo | Tipo de campo | Opciones / Notas |
|---|---|---|
| `Disponible` | Checkbox | **Valor por defecto: marcado (true).** Controla si el maestro recibe trabajos nuevos. Si no existen registros previos de maestros, no hace falta rellenar nada; si ya hay maestros cargados, marca este campo como `true` (disponible) en todos por defecto. |

No toques `Nombre Maestro`, `Teléfono`, `Especialidades`, `Comunas Disponibles`, `Verificado` ni `Calificación promedio` — deben seguir existiendo tal cual con esos nombres.

### 2. Tabla `Mensajes` — agregar un campo

| Nombre del campo | Tipo de campo | Opciones / Notas |
|---|---|---|
| `monto` | Number | Integer, sin decimales. Opcional (queda vacío en mensajes de texto normales). Se usa cuando un maestro envía una cotización de precio dentro del chat. |

No toques `lead_id`, `texto` ni `de`.

### 3. Tabla `Pagos` — agregar un campo y dos opciones

| Cambio | Detalle |
|---|---|
| Agregar campo `maestro` | Link to Maestros (una sola tabla, sin límite a un registro). Permite calcular y eventualmente transferir la comisión directo al maestro, sin pasar por Cotizaciones. |
| Agregar opción `pagado` al campo `estado` (Single select) | Se suma a las opciones existentes (`iniciado`, `retenido_escrow`, `liberado_al_maestro`, `reembolsado_al_cliente`, `disputa`) — no borres ninguna de las anteriores. |
| Agregar opción `webpay_placeholder` al campo `proveedor_pago` (Single select) | Se suma a las opciones existentes (`flow`, `khipu`, `transbank`, `transferencia_directa`) — no borres ninguna de las anteriores. Marca que el pago pasó por el punto de integración de desarrollo mientras no haya una pasarela real conectada. |

No toques `lead`, `monto_total_clp`, `porcentaje_comision`, `monto_comision_clp` ni `monto_maestro_clp`.

### 4. Tabla `Reseñas`

Sin cambios. Confirma únicamente que los campos `maestro` (Link to Maestros), `estrellas` (Rating o Number), `texto` (Long text) y `nombre_cliente` (Single line text) existan con esos nombres.

### 5. Tabla `Leads`

Sin cambios. Confirma que el campo `estado` (Single select) tenga la opción `completado` disponible (ya debería existir en el enum original: `pendiente, buscando, aceptado, cotizado, en_proceso, completado, cancelado`).

---

Al terminar, confirma cada campo/opción creada y en qué tabla quedó, para poder verificarlo contra el código.
