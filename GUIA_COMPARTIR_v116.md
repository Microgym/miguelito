# Mis Tareas v116 · puesta en marcha compartida

## 1. Supabase
1. Abre tu proyecto de Supabase.
2. Ve a **SQL Editor**.
3. Ejecuta entero `SUPABASE_SETUP_v116.sql`.
4. En **Authentication → URL Configuration**, añade como Redirect URL la dirección donde publiques la app.
5. Copia:
   - **Project URL**
   - **Publishable key** (o la antigua `anon key`)
   - NO uses `service_role`.

## 2. Primer progenitor
1. Abre **Más → Zona Padres → ☁️ Familia compartida**.
2. Pega Project URL + Publishable/anon key.
3. Pulsa **Guardar conexión**.
4. Escribe tu email y pulsa **Enviar enlace de acceso**.
5. Abre el enlace recibido por email.
6. Vuelve a Zona Padres.
7. Pulsa **Crear y subir esta familia**.
8. Copia el código de invitación que aparecerá.

La familia actual se sube completa.

## 3. Segundo progenitor
1. Abre la misma web. Si aparece la configuración inicial, pulsa **☁️ Ya tengo una familia compartida**.
2. Configura la misma Project URL + Publishable/anon key.
3. Inicia sesión con SU propio email.
4. Escribe el código de invitación.
5. Pulsa **Unirme a una familia**.

## Seguridad
- Cada progenitor tiene su propia cuenta.
- RLS limita el acceso a miembros de la familia.
- El código de invitación solo funciona después de iniciar sesión.
- Nunca uses `service_role` en la web.
- La app conserva copia local y sigue funcionando temporalmente sin conexión.
