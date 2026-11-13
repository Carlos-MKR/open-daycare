-- Fix del seed demo (SPEC 10): la insercion directa en auth.users sin
-- confirmation_token deja la columna en NULL y GoTrue falla al escanearla
-- en el login (HTTP 500 unexpected_failure). El signup real escribe '' en
-- esa columna, asi que se normalizan las filas heredadas del seed.
-- Idempotente: solo toca filas con NULL (las reales nunca las tienen).
update auth.users
set confirmation_token = ''
where confirmation_token is null;
