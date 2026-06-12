-- 04_productos.sql
-- Crea la tabla de productos de precio fijo (bebidas, cervezas, etc.)
-- que se pueden vender desde el POS sin deducción de inventario de ingredientes.

CREATE TABLE IF NOT EXISTS productos (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre       TEXT        NOT NULL UNIQUE,
    precio       NUMERIC     NOT NULL CHECK (precio >= 0),
    -- Categoría para agrupar visualmente en el POS
    -- Valores permitidos: 'pizza', 'gaseosa', 'cerveza', 'bebida'
    categoria    TEXT        NOT NULL CHECK (categoria IN ('pizza', 'gaseosa', 'cerveza', 'bebida')),
    activo       BOOLEAN     NOT NULL DEFAULT true,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: mismo patrón que la tabla ventas (acceso completo a autenticados)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo a usuarios autenticados"
    ON productos
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ─── SEED: Catálogo inicial de productos ─────────────────────────────────────
-- NOTA: Cada variante de sabor es un producto independiente para simplificar
-- la UI del POS (un click por producto, sin configuración adicional).

INSERT INTO productos (nombre, precio, categoria) VALUES
    -- Gaseosas 250ml
    ('Postobon Manzana 250ml',   2000, 'gaseosa'),
    ('Postobon Uva 250ml',       2000, 'gaseosa'),
    ('Postobon Colombiana 250ml',2000, 'gaseosa'),
    ('Pepsi 250ml',              2000, 'gaseosa'),
    ('NatuMalta 250ml',          2500, 'gaseosa'),

    -- Gaseosas 1L - 1.5L
    ('Postobon 1L',              3500, 'gaseosa'),
    ('NatuMalta 1L',             4500, 'gaseosa'),
    ('Canada Dry 1.5L',          7000, 'gaseosa'),
    ('Bretaña 1.5L',             5000, 'gaseosa'),

    -- Otras bebidas
    ('Limonada Natural',         3000, 'bebida'),

    -- Cervezas 330ml
    ('Poker 330ml',              4000, 'cerveza'),
    ('Águila 330ml',             4000, 'cerveza'),
    ('Águila Light 330ml',       4000, 'cerveza'),
    ('Club Colombia 330ml',      4500, 'cerveza'),

    -- Cervezas Botellón 830ml
    ('Club Colombia 830ml',      7000, 'cerveza')
ON CONFLICT (nombre) DO NOTHING;
