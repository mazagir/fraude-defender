# TODO - Conectar frontend + backend (login y reportes)

- [x] Reemplazar `frontend/src/components/Login.jsx` para hacer login real contra el backend desplegado (sin demo local).

- [ ] Confirmar/ajustar el endpoint de login usando pruebas automáticas contra rutas comunes (fetch OPTIONS/GET/POST) y manejar errores en UI.
- [ ] Si aplica, actualizar `frontend/src/services/api.js` con funciones `login()` y helpers consistentes de Authorization.
- [ ] Verificar que `frontend/src/App.jsx` y `ModalReporte.jsx` consumen `GET/POST /api/v1/reportes/` correctamente con token.
- [ ] Verificar DELETE en `TablaReportes.jsx`.
- [ ] Probar end-to-end:
  - [ ] Login -> entra a dashboard
  - [ ] Crear reporte -> aparece en tabla
  - [ ] Eliminar reporte -> se actualiza (o confirmar el refresh)

- [x] Añadir UI/endpoint para “simular ataques” (ataques/IoCs aleatorios) y refrescar dashboard.


