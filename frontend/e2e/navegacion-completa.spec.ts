import { test, expect, Page } from "@playwright/test";

const API = "http://localhost:8000";

async function setupApiMocks(page: Page) {
  await page.route(`${API}/api/v1/threat-intel*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        intel: [{
          id: 1, type: "phishing", severity: "critical",
          title: "Campaña QR-Code en Colombia",
          description: "Phishing masivo vía código QR en parqueaderos públicos",
          region: "Colombia", country: "CO", city: "Bogotá",
          timestamp: new Date().toISOString(),
          source: "AgiShield SOC",
          indicators: ["qr-code", "phishing", "pago"],
          affected_users: 2300, status: "active",
        }],
        stats: { total_threats: 47, active_campaigns: 12, users_affected: 125000, countries_monitored: 5 },
        loading: false, error: null,
      }),
    });
  });

  await page.route(`${API}/api/v1/reportes/publico/listar*`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });

  await page.route(`${API}/api/v1/reportes?page=1*`, async (route) => {
    await route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify([{ id: "r1", tipo: "phishing", descripcion: "URL sospechosa", pais: "CO", ciudad: "Bogotá", created_at: new Date().toISOString(), riesgo: "alto", estado: "activo" }]),
    });
  });

  await page.route(`${API}/api/v1/scan-history*`, async (route) => {
    await route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify([{ id: "sh1", tipo: "url", contenido: "https://malicioso.xyz", score: 85, severidad: "critico", created_at: new Date().toISOString() }]),
    });
  });

  await page.route(`${API}/api/v1/auth/mfa/status`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ mfa_active: false }) });
  });

  await page.route(`${API}/api/v1/auth/mfa/setup`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ qr_code: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", secret: "MFAFAKESECRET123", uri: "otpauth://totp/AgiShield:test@test.com?secret=MFAFAKESECRET123" }) });
  });

  await page.route(`${API}/api/v1/auth/mfa/enable`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
  });

  await page.route(`${API}/api/v1/auth/mfa/disable`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
  });

  await page.route(`${API}/api/v1/reportes/analizar`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ score: 87, level: "CRITICAL", explanation: "Enlace fraudulento de Phishing detectado", recommendations: ["No hagas clic en el enlace"], indicators: ["Dominio sospechoso"] }) });
  });

  await page.route(`${API}/api/v1/auth/registro`, async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ id: 1, nombre: "Test Usuario", email: "test@example.com" }) });
  });

  await page.route(`${API}/api/v1/auth/login`, async (route) => {
    await route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify({ access_token: "fake-jwt-token", token_type: "bearer", usuario: { id: 1, nombre: "Test Usuario", email: "test@example.com", rol: "usuario" } }),
    });
  });
}

async function doLogin(page: Page) {
  await page.click("text=Acceder / Registrarse");
  await page.waitForTimeout(600);
  await page.fill("#auth-email", "test@example.com");
  await page.fill("#auth-password", "ClaveSegura2026!");
  await page.click('button:has-text("Ingresar al SOC")');
  await page.waitForTimeout(1500);
}

test.describe("Navegación Completa — AgiShield AI", () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMocks(page);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);
  });

  test("1. Flujo como Invitado — todos los tabs disponibles", async ({ page }) => {
    // Home view — heading should be visible
    await expect(page.getByText("Protege tus cuentas")).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Analizar URL").first()).toBeVisible({ timeout: 5000 });

    // Navigate to Dashboard (locked for guest)
    await page.getByRole("button", { name: "Mi Perfil Seguro" }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText("Calcular Mi Riesgo").first()).toBeVisible({ timeout: 5000 });

    // Navigate to Community (available to guests)
    await page.getByRole("button", { name: "Comunidad y Mapa" }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText("Alertas y Mapa de la Comunidad")).toBeVisible({ timeout: 5000 });

    // Back to Home
    await page.getByRole("button", { name: "Detector de Estafas" }).click();
    await page.waitForTimeout(800);
    await expect(page.getByText("Protege tus cuentas")).toBeVisible({ timeout: 5000 });
  });

  test("2. Registro de usuario y dashboard desbloqueado", async ({ page }) => {
    // Open auth modal → switch to register → fill → submit
    await page.getByText("Acceder / Registrarse").click();
    await page.waitForTimeout(600);

    // Switch to register mode
    await page.getByText("Registrate aqui").click();
    await page.waitForTimeout(300);

    // Fill name
    await page.fill("#auth-nombre", "Test Usuario");
    await page.fill("#auth-email", "test@example.com");
    await page.fill("#auth-password", "ClaveSegura2026!");
    // Submit
    await page.getByRole("button", { name: "Registrarme" }).click();
    await page.waitForTimeout(2000);

    // After registration, user should be redirected to Dashboard
    // Header should show the user's name
    await expect(page.getByText("Test Usuario").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Reputación", { exact: false }).first()).toBeVisible({ timeout: 5000 });
  });

  test("3. Navegación ida y vuelta entre todos los tabs", async ({ page }) => {
    const sequence = ["Mi Perfil Seguro", "Detector de Estafas", "Comunidad y Mapa", "Detector de Estafas", "Mi Perfil Seguro", "Comunidad y Mapa", "Detector de Estafas"];

    for (const tab of sequence) {
      await page.getByRole("button", { name: tab }).click();
      await page.waitForTimeout(500);
    }

    await expect(page.getByText("Protege tus cuentas")).toBeVisible({ timeout: 5000 });
  });

  test("4. Modo Developer — toggle y navegación", async ({ page }) => {
    // The toggle input has sr-only class; click its label sibling instead
    const toggleLabel = page.locator("text=Modo Developer").locator("..").locator("label");
    await toggleLabel.click();
    await page.waitForTimeout(600);

    // Developer tab should now be visible
    await expect(page.getByText("Consola SOC (CTO)")).toBeVisible({ timeout: 3000 });

    // Turn off
    await toggleLabel.click();
    await page.waitForTimeout(600);

    // Should be back on home
    await expect(page.getByText("Protege tus cuentas")).toBeVisible({ timeout: 3000 });
  });

  test("5. Login existente — dashboard con contenido completo", async ({ page }) => {
    // Pre-set localStorage to simulate returning user
    await page.evaluate(() => {
      localStorage.setItem("aegis_token", "pre-existing-token");
      localStorage.setItem("aegis_user", JSON.stringify({ id: 1, nombre: "Carlos López", email: "carlos@example.com", rol: "usuario" }));
    });

    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);

    // Should see user name in header
    await expect(page.getByText("Carlos López").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Reputación", { exact: false }).first()).toBeVisible({ timeout: 5000 });

    // Go to Dashboard
    await page.getByRole("button", { name: "Mi Perfil Seguro" }).click();
    await page.waitForTimeout(1000);

    // Should see KPI content like "Incidentes semanales"
    await expect(page.getByText("Incidentes semanales")).toBeVisible({ timeout: 5000 });
    // Locked CTA buttons should NOT be present
    await expect(page.getByText("Registrarme")).toHaveCount(0);
  });

  test("6. Cierre de sesión y regreso a invitado", async ({ page }) => {
    await doLogin(page);
    await expect(page.getByText("Test Usuario").first()).toBeVisible({ timeout: 10000 });

    // Logout via sidebar
    await page.getByText("Cerrar Sesión").click();
    await page.waitForTimeout(800);

    // Should see login button again
    const loginBtn = page.getByRole("button", { name: "Acceder / Registrarse" });
    await expect(loginBtn.or(page.getByRole("button", { name: "Ingresar" })).first()).toBeVisible({ timeout: 5000 });
    // Should be redirected to home tab
    await expect(page.getByText("Protege tus cuentas")).toBeVisible({ timeout: 3000 });
  });
});
