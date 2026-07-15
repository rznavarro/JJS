# Metaprompt para Omni — Base de datos Airtable de JJS

## Contexto del proyecto

Crea una base de datos completa en Airtable para **JJS**, un marketplace chileno de servicios para el hogar. Funciona como Uber pero para maestros (gasfíteres, electricistas, pintores, etc.): el cliente describe su trabajo, lo recibe un maestro verificado, acepta y envía su cotización, el cliente paga por la plataforma y el dinero queda en escrow hasta que el trabajo termina.

El flujo principal es:
1. Cliente sube una solicitud (Lead)
2. Un Maestro la acepta y envía una Cotización
3. El cliente acepta la cotización y Paga
4. El maestro realiza el trabajo
5. El cliente confirma y libera el pago
6. El cliente deja una Reseña

La moneda es **CLP (pesos chilenos)**. La comunicación principal es **WhatsApp**. Operamos en **Rancagua, Machalí, Graneros y alrededores (Región de O'Higgins, Chile)**.

---

## INSTRUCCIONES PARA OMNI

Crea una base de Airtable llamada **"JJS — Marketplace"** con las siguientes 6 tablas. Crea TODOS los campos tal como se especifican, con sus tipos exactos y las opciones de los campos Single Select / Multiple Select.

---

## TABLA 1: Leads

**Descripción:** Cada solicitud de trabajo que envía un cliente desde el formulario de cotización.

| Nombre del campo | Tipo de campo | Opciones / Notas |
|---|---|---|
| `id_lead` | Autonumber | Identificador único automático |
| `oficio` | Single select | gasfiteria, electricidad, pintura, cerrajeria, carpinteria, otro |
| `descripcion` | Long text | Descripción del trabajo a realizar |
| `fotos` | Attachment | Fotos del problema o espacio |
| `comuna` | Single line text | |
| `direccion` | Single line text | |
| `urgencia` | Single select | hoy, esta_semana, sin_apuro |
| `nombre_cliente` | Single line text | |
| `whatsapp_cliente` | Phone number | Formato: 569XXXXXXXX |
| `email_cliente` | Email | |
| `estado` | Single select | pendiente, buscando, aceptado, cotizado, en_proceso, completado, cancelado |
| `maestro_asignado` | Link to Maestros | El maestro que aceptó la solicitud |
| `cotizacion` | Link to Cotizaciones | La cotización enviada para esta solicitud |
| `pago` | Link to Pagos | |
| `reseña` | Link to Reseñas | |
| `creado_en` | Created time | Automático |
| `actualizado_en` | Last modified time | Automático |
| `notas_internas` | Long text | Para el equipo de JJS |

**Vistas a crear:**
- "Todas las solicitudes" (Grid, ordenar por creado_en desc)
- "Pendientes hoy" (filtro: estado = pendiente O buscando, ordenar por urgencia)
- "Completadas" (filtro: estado = completado)
- "Canceladas" (filtro: estado = cancelado)

---

## TABLA 2: Maestros

**Descripción:** Perfiles de los trabajadores registrados en la plataforma.

| Nombre del campo | Tipo de campo | Opciones / Notas |
|---|---|---|
| `id_maestro` | Autonumber | |
| `nombre` | Single line text | |
| `oficio` | Single select | gasfiteria, electricidad, pintura, cerrajeria, carpinteria |
| `oficios_secundarios` | Multiple select | gasfiteria, electricidad, pintura, cerrajeria, carpinteria |
| `comuna` | Single line text | |
| `comunas_servicio` | Multiple select | Rancagua, Machalí, Graneros, Coinco, Doñihue, Las Cabras, Mostazal, San Francisco de Mostazal |
| `experiencia` | Single select | menos_1_anio, 1_a_5_anios, 5_a_10_anios, mas_de_10_anios |
| `whatsapp` | Phone number | Formato: 569XXXXXXXX |
| `email` | Email | |
| `sec` | Checkbox | Certificación SEC (obligatoria para electricistas) |
| `badge` | Single select | Verificado, SEC, Premium |
| `plan` | Single select | basico, premium |
| `estado` | Single select | pendiente_revision, activo, suspendido, rechazado |
| `rating_promedio` | Number | Decimal, 1 decimal. Calculado manualmente o con automatización |
| `total_trabajos` | Number | Integer. Número de trabajos cerrados |
| `total_ganado_clp` | Currency | CLP. Total histórico ganado (sin comisión JJS) |
| `fecha_registro` | Created time | Automático |
| `fecha_activacion` | Date | Cuando el equipo JJS activó el perfil |
| `kyc_verificado` | Checkbox | Identidad verificada |
| `foto_perfil` | Attachment | Foto del maestro |
| `descripcion_personal` | Long text | Bio del maestro para su perfil |
| `banco` | Single select | BancoEstado, Banco de Chile, Santander, BCI, Itaú, Scotiabank, Mercado Pago, otro |
| `tipo_cuenta` | Single select | cuenta_corriente, cuenta_vista, cuenta_rut |
| `numero_cuenta` | Single line text | Para transferencias |
| `rut` | Single line text | RUT chileno para facturación |
| `cotizaciones` | Link to Cotizaciones | |
| `reseñas` | Link to Reseñas | |
| `leads_asignados` | Link to Leads | |
| `notas_internas` | Long text | Para el equipo de JJS |

**Vistas a crear:**
- "Todos los maestros" (Grid)
- "Pendientes de revisión" (filtro: estado = pendiente_revision)
- "Activos" (filtro: estado = activo, agrupar por oficio)
- "Top maestros" (filtro: estado = activo, ordenar por rating_promedio desc)

---

## TABLA 3: Cotizaciones

**Descripción:** Cada propuesta económica que un maestro envía al cliente.

| Nombre del campo | Tipo de campo | Opciones / Notas |
|---|---|---|
| `id_cotizacion` | Autonumber | |
| `lead` | Link to Leads | La solicitud a la que responde |
| `maestro` | Link to Maestros | El maestro que cotiza |
| `precio_total_clp` | Currency | CLP. Monto total que el cliente paga |
| `plazo` | Single line text | Ej: "Mañana 10:00", "En 3 días" |
| `descripcion_trabajo` | Long text | Qué incluye la cotización |
| `materiales_incluidos` | Checkbox | Si el precio incluye materiales |
| `garantia_dias` | Number | Integer. Días de garantía ofrecidos |
| `estado` | Single select | enviada, vista, aceptada, rechazada, vencida |
| `mensajes` | Link to Mensajes | |
| `pago` | Link to Pagos | |
| `creado_en` | Created time | |
| `vence_en` | Date | Fecha hasta la que es válida la cotización |
| `notas_cliente` | Long text | Comentarios del cliente al aceptar/rechazar |

**Vistas a crear:**
- "Todas" (Grid)
- "Aceptadas" (filtro: estado = aceptada)
- "Pendientes de respuesta" (filtro: estado = enviada O vista)

---

## TABLA 4: Mensajes

**Descripción:** Chat entre cliente y maestro dentro de una cotización/trabajo.

| Nombre del campo | Tipo de campo | Opciones / Notas |
|---|---|---|
| `id_mensaje` | Autonumber | |
| `cotizacion` | Link to Cotizaciones | Conversación a la que pertenece |
| `remitente` | Single select | cliente, maestro, sistema |
| `texto` | Long text | Contenido del mensaje |
| `adjuntos` | Attachment | Fotos o documentos enviados en el chat |
| `leido` | Checkbox | Si el destinatario ya leyó el mensaje |
| `tipo` | Single select | texto, cotizacion_enviada, pago_recibido, trabajo_iniciado, trabajo_completado, reseña_solicitada |
| `creado_en` | Created time | |

**Vistas a crear:**
- "Todos los mensajes" (Grid, ordenar por creado_en desc)
- "No leídos" (filtro: leido = false)

---

## TABLA 5: Pagos

**Descripción:** Transacciones de pago entre clientes y maestros, con modelo de escrow.

| Nombre del campo | Tipo de campo | Opciones / Notas |
|---|---|---|
| `id_pago` | Autonumber | |
| `cotizacion` | Link to Cotizaciones | |
| `lead` | Link to Leads | |
| `monto_total_clp` | Currency | CLP. Lo que paga el cliente |
| `porcentaje_comision` | Number | 6 o 12. Porcentaje que cobra JJS |
| `monto_comision_clp` | Currency | CLP. Calculado: monto_total × porcentaje_comision / 100 |
| `monto_maestro_clp` | Currency | CLP. Lo que recibe el maestro: monto_total − monto_comision |
| `estado` | Single select | iniciado, retenido_escrow, liberado_al_maestro, reembolsado_al_cliente, disputa |
| `proveedor_pago` | Single select | flow, khipu, transbank, transferencia_directa |
| `id_transaccion_externo` | Single line text | ID de la transacción en Flow / Khipu |
| `url_comprobante` | URL | Link al comprobante del proveedor de pago |
| `fecha_pago` | Date | Cuando el cliente pagó |
| `fecha_liberacion` | Date | Cuando se liberó el dinero al maestro |
| `fecha_transferencia_maestro` | Date | Cuando se hizo la transferencia al maestro |
| `notas_internas` | Long text | |
| `creado_en` | Created time | |

**Vistas a crear:**
- "Todos los pagos" (Grid, ordenar por fecha_pago desc)
- "En escrow" (filtro: estado = retenido_escrow)
- "Listos para transferir" (filtro: estado = liberado_al_maestro)
- "Disputas" (filtro: estado = disputa)

---

## TABLA 6: Reseñas

**Descripción:** Calificaciones que los clientes dejan a los maestros al finalizar el trabajo.

| Nombre del campo | Tipo de campo | Opciones / Notas |
|---|---|---|
| `id_reseña` | Autonumber | |
| `cotizacion` | Link to Cotizaciones | |
| `maestro` | Link to Maestros | |
| `nombre_cliente` | Single line text | |
| `estrellas` | Rating | Escala 1–5 |
| `titulo` | Single line text | Ej: "Excelente trabajo" |
| `texto` | Long text | Comentario detallado |
| `puntualidad` | Rating | Escala 1–5 |
| `calidad_trabajo` | Rating | Escala 1–5 |
| `comunicacion` | Rating | Escala 1–5 |
| `precio_justo` | Rating | Escala 1–5 |
| `recomendaria` | Checkbox | ¿Lo recomendarías a un amigo? |
| `visible` | Checkbox | Si la reseña está publicada (por defecto: true) |
| `creado_en` | Created time | |

**Vistas a crear:**
- "Todas las reseñas" (Grid, ordenar por creado_en desc)
- "5 estrellas" (filtro: estrellas = 5)
- "Negativas" (filtro: estrellas ≤ 2)
- "Por maestro" (agrupar por maestro)

---

## Resumen de relaciones

```
Leads ──────────────── Maestros (maestro_asignado)
  │
  ├── Cotizaciones ─── Maestros
  │       │
  │       ├── Mensajes
  │       └── Pagos
  │
  └── Reseñas ──────── Maestros
```

---

## Configuración adicional

- **Moneda base:** CLP (Peso chileno)
- **Zona horaria:** America/Santiago
- **Idioma de la base:** Español
- El campo `estado` de **Leads** define el ciclo de vida de cada solicitud:
  `pendiente → buscando → aceptado → cotizado → en_proceso → completado`
- El campo `estado` de **Pagos** define el ciclo del dinero en escrow:
  `iniciado → retenido_escrow → liberado_al_maestro`
- El campo `estado` de **Maestros** define si pueden recibir trabajos:
  solo los maestros con `estado = activo` aparecen en el marketplace
