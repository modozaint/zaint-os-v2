# Instagram Graph API — Guía de Referencia

Guía de los endpoints relevantes para Content OS.

---

## Autenticación

Se necesita un **Long-Lived User Access Token** con los siguientes permisos:
- `instagram_basic`
- `instagram_manage_insights`
- `pages_show_list`
- `pages_read_engagement`

**Obtener token:**
1. Crear app en Meta for Developers (developers.facebook.com)
2. Agregar producto "Instagram Graph API"
3. Generar User Access Token (short-lived, 1h)
4. Intercambiar por Long-Lived Token (60 días):
   ```
   GET https://graph.facebook.com/v21.0/oauth/access_token
     ?grant_type=fb_exchange_token
     &client_id={APP_ID}
     &client_secret={APP_SECRET}
     &fb_exchange_token={SHORT_LIVED_TOKEN}
   ```

**Renovación:** El long-lived token se puede renovar antes de que expire:
```
GET https://graph.facebook.com/v21.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id={APP_ID}
  &client_secret={APP_SECRET}
  &fb_exchange_token={CURRENT_LONG_LIVED_TOKEN}
```

**Configurar en `.env.local`:**
```env
INSTAGRAM_ACCESS_TOKEN=el_token_largo
INSTAGRAM_USER_ID=tu_id_numerico
```

Para obtener tu `INSTAGRAM_USER_ID`:
```
GET https://graph.facebook.com/v21.0/me?fields=id&access_token={TOKEN}
```

---

## Endpoints Usados

### Listar media del perfil
```
GET https://graph.facebook.com/v21.0/{USER_ID}/media
  ?fields=id,caption,media_type,thumbnail_url,permalink,timestamp,video_duration
  &limit=50
  &access_token={TOKEN}
```

Filtrar por `media_type === 'VIDEO' || media_type === 'REEL'`

### Insights por video
```
GET https://graph.facebook.com/v21.0/{MEDIA_ID}/insights
  ?metric=reach,likes,comments,shares,saved,ig_reels_avg_watch_time
  &access_token={TOKEN}
```

| Métrica | Descripción |
|---------|-------------|
| `reach` | Cuentas únicas que vieron el video |
| `likes` | Total de likes |
| `comments` | Total de comentarios |
| `shares` | Veces compartido |
| `saved` | Veces guardado |
| `ig_reels_avg_watch_time` | Tiempo promedio de visualización en **milisegundos** |

### Obtener media_url (para descarga/transcripción)
```
GET https://graph.facebook.com/v21.0/{MEDIA_ID}?fields=media_url&access_token={TOKEN}
```

**CRÍTICO:** Esta URL expira en ~1 hora. Nunca cachearla. Siempre fetchear fresh inmediatamente antes de usar.

---

## Limitaciones Conocidas

| Limitación | Detalle |
|-----------|---------|
| Curva de retención | No disponible via API pública. Solo en Creator Studio. Usar `ig_reels_avg_watch_time` como proxy. |
| `video_duration` | No disponible para cuentas personales/pequeñas. El campo se ignora silenciosamente. |
| Insights delay | Los insights pueden tardar hasta 24h en reflejar datos precisos. |
| Rate limit | 200 calls/hora por user token (tier estándar) |
| Token expiry | Long-lived token expira exactamente a los 60 días |
| media_url | Expira ~1h. Si falla al descargar, fetchear nueva URL. |

---

## Debugging Común

**Error "Invalid OAuth access token":**
- El token expiró. Renovar siguiendo el proceso de autenticación.

**Error "Unsupported get request" en insights:**
- El video es muy nuevo (< 24h). Los insights aún no están disponibles.
- Algunos videos privados no exponen insights.

**media_url devuelve error 400/403:**
- La URL expiró. Re-fetchear con el endpoint de media_url.

---

## Testing

Graph API Explorer: developers.facebook.com/tools/explorer/

Permite probar endpoints manualmente con el token de desarrollo.
