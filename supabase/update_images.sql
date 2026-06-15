-- 1. Añadir columna si no existe
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- 2. Actualizar las imágenes
UPDATE productos SET imagen_url = '/images/productos/postobon_manzana.webp' WHERE nombre ILIKE '%Postobon Manzana%';
UPDATE productos SET imagen_url = '/images/productos/postobon_uva.webp' WHERE nombre ILIKE '%Postobon Uva%';
UPDATE productos SET imagen_url = '/images/productos/postobon_colombiana.webp' WHERE nombre ILIKE '%Postobon Colombiana%';
UPDATE productos SET imagen_url = '/images/productos/pepsi.webp' WHERE nombre ILIKE '%Pepsi%';
UPDATE productos SET imagen_url = '/images/productos/natumalta.webp' WHERE nombre ILIKE '%NatuMalta%';
UPDATE productos SET imagen_url = '/images/productos/canada_dry.webp' WHERE nombre ILIKE '%Canada Dry%';
UPDATE productos SET imagen_url = '/images/productos/bretana.png' WHERE nombre ILIKE '%Bretaña%';
UPDATE productos SET imagen_url = '/images/productos/limonada_natural.webp' WHERE nombre ILIKE '%Limonada Natural%';

UPDATE productos SET imagen_url = '/images/productos/poker.webp' WHERE nombre ILIKE '%Poker%';
UPDATE productos SET imagen_url = '/images/productos/aguila.webp' WHERE nombre ILIKE '%Águila 330ml%';
UPDATE productos SET imagen_url = '/images/productos/aguila_light.webp' WHERE nombre ILIKE '%Águila Light%';
UPDATE productos SET imagen_url = '/images/productos/club_colombia.webp' WHERE nombre ILIKE '%Club Colombia 330ml%';
UPDATE productos SET imagen_url = '/images/productos/club_colombia_850.webp' WHERE nombre ILIKE '%Club Colombia 850ml%';
UPDATE productos SET imagen_url = '/images/productos/corona.webp' WHERE nombre ILIKE '%Corona%';
