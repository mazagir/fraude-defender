-- ============================================
-- MIGRACIÓN fraude-defender-db → Supabase
-- Pega esto en Supabase → SQL Editor → Run
-- ============================================

-- 1. TABLAS
-- ============================================

CREATE TABLE IF NOT EXISTS public.fraud_reports (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR,
    bank_account VARCHAR,
    domain VARCHAR,
    description VARCHAR,
    risk_level VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now(),
    risk_score INTEGER DEFAULT 0,
    malicious_indicators TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    hashed_password VARCHAR NOT NULL,
    es_activo BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. DATOS fraud_reports
-- ============================================

INSERT INTO public.fraud_reports (id, phone_number, bank_account, domain, description, risk_level, created_at, risk_score, malicious_indicators) VALUES
(1, '+573001112233', '987654321', 'prestamos-rapidos.xyz', 'Aplicación usada para amenazas y extorsión', 'alto', '2026-05-23 01:18:23.347511+00', 0, ''),
(2, '+573001112233', '987654321', 'prestamos-rapidos.xyz', 'Aplicación usada para amenazas y extorsión', 'alto', '2026-05-23 01:18:39.735578+00', 0, ''),
(3, '+573135238456', '313546897', 'rapicredit', 'prestamos en 20 minuto y alas dos hora doxeo de numero', 'bajo', '2026-05-23 02:08:23.337805+00', 0, ''),
(4, '+573001999888', 'prestamos-ya.xyz', NULL, 'Aplicación de préstamos fraudulenta que extorsiona usuarios', 'alto', '2026-05-23 07:37:00.105158+00', 0, ''),
(7, '3001234567', 'Nequi 3001234567', 'prestamofacil.xyz', 'Aplicación de préstamos fraudulenta extorsiona usuarios', 'MEDIUM', '2026-05-27 05:59:55.889977+00', 50, 'TLD altamente sospechoso, Patrón de extorsión detectado (extorsion)'),
(8, '+57319782174', NULL, 'https://bancolombia-actualiza-datos.net', 'Phishing activo detectado: Su crédito express ha sido aprobado. Retire los fondos completando el formulario: https://bancolombia-actualiza-datos.net', 'Alto', '2026-05-27 06:05:45.904752+00', 20, 'Patrón de extorsión detectado (phishing)'),
(9, '+57310592817', 'Nequi - Ahorros: 48012790', NULL, 'Cuenta mula detectada. Utilizada para dispersión de fondos ilegales de gota a gota digital.', 'Alto', '2026-05-27 06:05:49.103727+00', 10, 'Ninguno'),
(10, '+57310106986', NULL, 'https://bancolombia-actualiza-datos.net', 'Phishing activo detectado: Su crédito express ha sido aprobado. Retire los fondos completando el formulario: https://bancolombia-actualiza-datos.net', 'Alto', '2026-05-27 06:05:52.285813+00', 50, 'Dominio reportado previamente, Patrón de extorsión detectado (phishing)'),
(11, '+57314162739', NULL, NULL, 'Llamada coactiva registrada. El atacante usa técnicas de ingeniería social para extorsión.', 'Medio', '2026-05-27 06:05:55.71072+00', 20, 'Patrón de extorsión detectado (extorsión)'),
(12, '+57313393591', NULL, NULL, 'Llamada coactiva registrada. El atacante usa técnicas de ingeniería social para extorsión.', 'Medio', '2026-05-27 06:06:00.406139+00', 20, 'Patrón de extorsión detectado (extorsión)'),
(13, '+57319160741', 'Bancolombia - Ahorros: 95880110', NULL, 'Cuenta mula detectada. Utilizada para dispersión de fondos ilegales de gota a gota digital.', 'Alto', '2026-05-27 06:07:44.437496+00', 10, 'Ninguno'),
(14, '+57314720904', NULL, NULL, 'Llamada coactiva registrada. El atacante usa técnicas de ingeniería social para extorsión.', 'Medio', '2026-05-27 06:07:48.06729+00', 20, 'Patrón de extorsión detectado (extorsión)'),
(15, '+57314382175', NULL, 'https://verificacion-co.com', 'Phishing activo detectado: NOTIFICACIÓN JUDICIAL: Registra cobro coactivo. Evite el embargo pagando aquí: https://verificacion-co.com', 'Alto', '2026-05-27 06:07:51.561517+00', 30, 'Patrón de extorsión detectado (cobro, phishing)'),
(16, '+57319996425', NULL, 'https://bancolombia-actualiza-datos.net', 'Phishing activo detectado: ALERTA: Intento de acceso no autorizado. Verifique su cuenta inmediatamente en: https://bancolombia-actualiza-datos.net', 'Alto', '2026-05-27 06:07:55.168003+00', 50, 'Dominio reportado previamente, Patrón de extorsión detectado (phishing)'),
(17, '+57315486086', NULL, NULL, 'Llamada coactiva registrada. El atacante usa técnicas de ingeniería social para extorsión.', 'Medio', '2026-05-27 06:07:59.851721+00', 20, 'Patrón de extorsión detectado (extorsión)');

-- 3. DATOS usuarios
-- ============================================

INSERT INTO public.users (id, nombre, email, hashed_password, es_activo, created_at) VALUES
(1, 'string', 'string', '$2b$12$eCkgkmlH550U9rurfM5s8O5zdUxPOe4RbWOX8Nck6Qy6Cl.SOSZeC', true, '2026-05-24 05:32:38.98334+00'),
(2, 'Neil Maza', 'neil@gmail.com', '$2b$12$pvPoAEUwGO4k1yDYGXSWx.pQq3ADnJezfefKInOZYJH1v41dyvsF6', true, '2026-05-24 05:32:42.829732+00'),
(3, 'neil', 'neil@mail.com', '$2b$12$2jJRkc8T2nScbdln.6TZ/.NTRkG5zRH6XWd9NGvCLOKaqV7kWj5y6', true, '2026-05-24 05:49:29.96887+00'),
(4, 'jose Vlaz', 'vlasjose@mail.com', '$2b$12$0Z0WDb502irxxRSrYxODBOThySujprfo8c3WjiRlYo1N7Lxw2KjrS', true, '2026-05-24 22:03:55.557825+00');

-- 4. AJUSTAR SECUENCIAS (para que el próximo INSERT no colisione)
-- ============================================

SELECT setval('public.fraud_reports_id_seq', (SELECT MAX(id) FROM public.fraud_reports));
SELECT setval('public.users_id_seq', (SELECT MAX(id) FROM public.users));
