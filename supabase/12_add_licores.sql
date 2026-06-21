ALTER TABLE productos DROP CONSTRAINT IF EXISTS productos_categoria_check;
ALTER TABLE productos ADD CONSTRAINT productos_categoria_check 
CHECK (categoria IN ('pizza', 'gaseosa', 'cerveza', 'bebida', 'cigarrillo', 'licor'));

ALTER TABLE ingredientes DROP CONSTRAINT IF EXISTS ingredientes_categoria_check;
ALTER TABLE ingredientes ADD CONSTRAINT ingredientes_categoria_check 
CHECK (categoria IN ('insumo', 'bebida', 'gaseosa', 'cerveza', 'cigarrillo', 'licor'));

INSERT INTO productos (nombre, precio, categoria, activo)
VALUES 
('Aguardiente Amarillo 1 botella 750ml', 80000, 'licor', true),
('Aguardiente Amarillo 1/2 botella 375ml', 50000, 'licor', true);

INSERT INTO ingredientes (nombre, precio, categoria, stock_actual, unidad_medida, punto_reorden)
VALUES 
('Aguardiente Amarillo 1 botella 750ml', 80000, 'licor', 0, 'unidad', 0),
('Aguardiente Amarillo 1/2 botella 375ml', 50000, 'licor', 0, 'unidad', 0);
