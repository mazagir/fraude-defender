# TODO - Refactor App.jsx (descomponer en componentes/vistas)

- [ ] Paso 1: Crear utilidades de riesgo/graphs en `frontend/src/utils/risk.js`.
- [ ] Paso 2: Crear archivos de vistas/componentes:
  - `frontend/src/views/LandingView.jsx`
  - `frontend/src/views/LoginView.jsx`
  - `frontend/src/views/PublicReportsView.jsx`
  - `frontend/src/views/DashboardView.jsx`
  - `frontend/src/views/ReportesView.jsx`
  - `frontend/src/views/AmenazasView.jsx`
  - `frontend/src/views/ThreatIntelView.jsx`
  - `frontend/src/components/WorldThreatMap.jsx`
  - `frontend/src/components/AIReasoningPanel.jsx`
  - `frontend/src/components/RiskBadge.jsx`
  - `frontend/src/components/ReportModal.jsx`
- [ ] Paso 3: Refactor de `frontend/src/App.jsx` para que solo maneje estado/handlers y renderice las vistas/imports.
- [ ] Paso 4: Ajustar imports (especialmente `riskColor`, `riskBg`, `getRiskLevel`, `buildMonthlyData`, `buildTrendData`).
- [ ] Paso 5: Ejecutar build/dev para verificar que compila sin errores.
- [ ] Paso 6: (Opcional) Si hay hooks/duplicados, mantener UI igual y solo reubicar código.

