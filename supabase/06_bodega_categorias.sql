-- 06_bodega_categorias.sql
-- Añade la columna 'categoria' a la tabla ingredientes para diferenciar
-- entre insumos de producción y bebidas que se venden directamente.

ALTER TABLE ingredientes 
ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'insumo' 
CHECK (categoria IN ('insumo', 'bebida'));

-- Actualizar comentarios de tabla para contexto
COMMENT ON COLUMN ingredientes.categoria IS 'Clasificación en bodega: "insumo" para ingredientes de recetas, "bebida" para productos directos.';
