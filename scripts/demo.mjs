#!/usr/bin/env node
/**
 * Demo local de AgielShield en un solo comando.
 *
 * Uso:
 *   npm run demo
 *   npm run demo -- --no-open
 *   npm run demo -- --seed-only
 *   npm run demo -- --force-seed
 *
 * No usa ni imprime secretos. Genera una clave JWT efímera solo para la sesión.
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import net from "node:net";
import { dirname, join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backendDir = join(root, "backend");
const frontendDir = join(root, "frontend");
const args = new Set(process.argv.slice(2));

const NO_OPEN = args.has("--no-open");
const SEED_ONLY = args.has("--seed-only");
const FORCE_SEED = args.has("--force-seed");
const SKIP_INSTALL = args.has("--no-install");

const BACKEND_URL = "http://127.0.0.1:8000";
const FRONTEND_URL = "http://localhost:5173";
const children = [];
let shuttingDown = false;

const log = (msg) => console.log(`\x1b[36m[demo]\x1b[0m ${msg}`);
const fail = (msg) => {
  console.error(`\x1b[31m[demo] ${msg}\x1b[0m`);
  process.exit(1);
};

function run(cmd, cmdArgs, options = {}) {
  const printable = [cmd, ...cmdArgs].join(" ");
  log(`$ ${printable}`);
  const result = spawnSync(cmd, cmdArgs, { stdio: "inherit", ...options });
  if (result.error) {
    console.error(result.error.message);
    return 1;
  }
  return result.status ?? 1;
}

function commandAvailable(cmd, prefixArgs = []) {
  const result = spawnSync(cmd, [...prefixArgs, "--version"], { stdio: "ignore" });
  return !result.error && result.status === 0;
}

function basePython() {
  if (process.platform === "win32") {
    if (commandAvailable("py", ["-3"])) return { cmd: "py", args: ["-3"] };
    if (commandAvailable("python")) return { cmd: "python", args: [] };
  } else {
    if (commandAvailable("python3")) return { cmd: "python3", args: [] };
    if (commandAvailable("python")) return { cmd: "python", args: [] };
  }
  fail("No se encontró Python 3. Instálalo y vuelve a ejecutar npm run demo.");
}

function venvPython() {
  const candidates =
    process.platform === "win32"
      ? [join(backendDir, ".venv", "Scripts", "python.exe")]
      : [join(backendDir, ".venv", "bin", "python")];
  return candidates.find((p) => existsSync(p)) ?? null;
}

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function start(cmd, cmdArgs, options = {}) {
  const child = spawn(cmd, cmdArgs, {
    stdio: "inherit",
    detached: process.platform !== "win32",
    ...options,
  });
  children.push(child);
  child.on("error", (err) => console.error(`[demo] ${cmd}: ${err.message}`));
  child.on("exit", (code) => {
    if (!shuttingDown && code) {
      console.error(`\x1b[31m[demo] El proceso terminó con código ${code}: ${cmd}\x1b[0m`);
      shutdown(1);
    }
  });
  return child;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(value);
    };
    socket.setTimeout(700);
    socket.on("connect", () => finish(true));
    socket.on("error", () => finish(false));
    socket.on("timeout", () => finish(false));
  });
}

async function httpOk(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForHttp(url, label, timeoutMs = 90000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await httpOk(url)) {
      log(`${label} listo.`);
      return;
    }
    await delay(600);
  }
  fail(`${label} no respondió en ${Math.round(timeoutMs / 1000)} s.`);
}

function openBrowser(url) {
  if (process.platform === "win32") {
    spawnSync("cmd", ["/c", "start", "", url], { stdio: "ignore" });
  } else if (process.platform === "darwin") {
    spawnSync("open", [url], { stdio: "ignore" });
  } else {
    spawnSync("xdg-open", [url], { stdio: "ignore" });
  }
}

function killChild(child) {
  if (!child.pid || child.exitCode !== null) return;
  try {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
    } else if (child.detached) {
      process.kill(-child.pid, "SIGTERM");
    } else {
      child.kill("SIGTERM");
    }
  } catch {
    // El proceso ya terminó.
  }
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  children.forEach(killChild);
  setTimeout(() => process.exit(code), 250).unref();
}

async function main() {
  console.log("\n\x1b[1m🛡️  AgielShield — demo local interactiva\x1b[0m\n");

  let py = venvPython();
  if (!py) {
    const { cmd, args: prefix } = basePython();
    log("Creando entorno virtual de Python...");
    if (run(cmd, [...prefix, "-m", "venv", join(backendDir, ".venv")], { cwd: backendDir }) !== 0) {
      fail("No se pudo crear backend/.venv");
    }
    py = venvPython();
    if (!py) fail("No se encontró el intérprete del entorno virtual recién creado.");
  }

  if (!SKIP_INSTALL) {
    log("Instalando dependencias del backend (si hace falta)...");
    if (run(py, ["-m", "pip", "install", "-r", "requirements.txt"], { cwd: backendDir }) !== 0) {
      fail("No se pudieron instalar las dependencias del backend.");
    }
  }

  const jwtSecret = randomBytes(32).toString("hex");
  const backendEnv = {
    ...process.env,
    ENVIRONMENT: "development",
    DB_PROVIDER: "sqlite",
    JWT_SECRET_KEY: jwtSecret,
    BACKEND_CORS_ORIGINS: "http://localhost:5173,http://127.0.0.1:5173",
  };

  const seedArgs = [join(backendDir, "tools", "seed_demo.py")];
  if (FORCE_SEED) seedArgs.push("--force");
  log("Sembrando incidentes de demostración en SQLite...");
  if (run(py, seedArgs, { cwd: backendDir, env: backendEnv }) !== 0) {
    fail("No se pudo sembrar la base de datos de demostración.");
  }

  if (SEED_ONLY) {
    log("Datos de demostración listos.");
    return;
  }

  if (await portOpen(8000)) {
    if (!(await httpOk(`${BACKEND_URL}/health`))) {
      fail("El puerto 8000 está ocupado por otro proceso que no es AgielShield.");
    }
    log("Reutilizando backend existente en el puerto 8000.");
  } else {
    log("Arrancando API FastAPI en http://127.0.0.1:8000 ...");
    start(py, ["-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"], {
      cwd: backendDir,
      env: backendEnv,
    });
    await waitForHttp(`${BACKEND_URL}/health`, "API");
  }

  if (!SKIP_INSTALL && !existsSync(join(frontendDir, "node_modules"))) {
    log("Instalando dependencias del frontend...");
    if (run(npmCommand(), ["ci"], { cwd: frontendDir }) !== 0) {
      fail("No se pudieron instalar las dependencias del frontend.");
    }
  }

  const frontendEnv = {
    ...process.env,
    VITE_API_URL: BACKEND_URL,
  };

  if (await portOpen(5173)) {
    log("Reutilizando frontend existente en el puerto 5173.");
  } else {
    log("Arrancando frontend Vite en http://localhost:5173 ...");
    start(npmCommand(), ["run", "dev", "--", "--host", "127.0.0.1", "--port", "5173"], {
      cwd: frontendDir,
      env: frontendEnv,
    });
    await waitForHttp(FRONTEND_URL, "Frontend");
  }

  log("Demo lista 👉 http://localhost:5173");
  log("API docs 👉 http://localhost:8000/docs");
  log("Pulsa Ctrl+C para detener todos los procesos.");

  if (!NO_OPEN) openBrowser(FRONTEND_URL);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
process.on("exit", () => killChildSafe());

function killChildSafe() {
  children.forEach((child) => {
    if (child.exitCode === null && child.pid) {
      try {
        if (process.platform === "win32") {
          spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
        } else if (child.detached) {
          process.kill(-child.pid, "SIGTERM");
        }
      } catch {
        // no-op
      }
    }
  });
}

main().catch((err) => {
  fail(err?.stack ?? String(err));
});
