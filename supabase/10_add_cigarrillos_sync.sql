-- 10_add_cigarrillos_sync.sql

-- 1. Actualizar el constraint de 'categoria' en la tabla 'productos'
ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_categoria_check;
ALTER TABLE productos ADD CONSTRAINT productos_categoria_check 
CHECK (categoria IN ('pizza', 'gaseosa', 'cerveza', 'bebida', 'cigarrillo'));

-- 2. Actualizar el constraint de 'categoria' en la tabla 'ingredientes'
ALTER TABLE ingredientes DROP CONSTRAINT IF EXISTS ingredientes_categoria_check;
ALTER TABLE ingredientes ADD CONSTRAINT ingredientes_categoria_check 
CHECK (categoria IN ('insumo', 'bebida', 'gaseosa', 'cerveza', 'cigarrillo'));

-- 3. Añadir la columna 'precio' a 'ingredientes'
ALTER TABLE ingredientes 
ADD COLUMN IF NOT EXISTS precio NUMERIC NOT NULL DEFAULT 0 
CHECK (precio >= 0);

COMMENT ON COLUMN ingredientes.precio IS 'Precio de venta. Sincronizado con la tabla de productos para items de venta directa.';
