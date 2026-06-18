-- 11_update_categorias_bebidas.sql

-- Este script es opcional y sirve para categorizar automáticamente masivamente 
-- ingredientes y productos que actualmente están como 'bebida' pero son gaseosas o cervezas.

-- 1. Actualizar Cervezas en Ingredientes y Productos
UPDATE ingredientes 
SET categoria = 'cerveza' 
WHERE categoria = 'bebida' 
  AND nombre ILIKE ANY (ARRAY['%cerveza%', '%pilsener%', '%club%', '%corona%', '%stella%', '%heineken%', '%biela%']);

UPDATE productos 
SET categoria = 'cerveza' 
WHERE categoria = 'bebida' 
  AND nombre ILIKE ANY (ARRAY['%cerveza%', '%pilsener%', '%club%', '%corona%', '%stella%', '%heineken%', '%biela%']);

-- 2. Actualizar Gaseosas en Ingredientes y Productos
UPDATE ingredientes 
SET categoria = 'gaseosa' 
WHERE categoria = 'bebida' 
  AND nombre ILIKE ANY (ARRAY['%gaseosa%', '%coca cola%', '%coca-cola%', '%sprite%', '%fanta%', '%pepsi%', '%7up%', '%seven up%', '%fiesta%', '%tropical%']);

UPDATE productos 
SET categoria = 'gaseosa' 
WHERE categoria = 'bebida' 
  AND nombre ILIKE ANY (ARRAY['%gaseosa%', '%coca cola%', '%coca-cola%', '%sprite%', '%fanta%', '%pepsi%', '%7up%', '%seven up%', '%fiesta%', '%tropical%']);
