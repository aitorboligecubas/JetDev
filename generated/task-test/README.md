VERSION A modified

Flujo automatico de subida a GitHub:
- Se genera el proyecto y la tarea queda en `deployed` con `projectPath`.
- Al aceptar cambios, la tarea pasa a `pushing`.
- El backend llama a `pushToGitHub(...)`, hace commit y push con Git CLI.
- Si todo va bien, guarda `repoUrl`, `branch`, `branchUrl` y pasa a `accepted`.
- Si falla, guarda el error y pasa a `error`.


Verificacion real de push con contenido: 2026-04-25 13:58:04
