-- seed_v2.sql: Carga Completa del Menú e Inventario de Las Pipzhas
-- Advertencia: Esto limpiará los datos actuales para cargar la nueva matriz exacta.

TRUNCATE TABLE historial_inventario, recetas_toppings, tamanos_pizza, ingredientes CASCADE;

DO $$
DECLARE
    -- UUIDs para Empaques
    v_caja_personal UUID := gen_random_uuid();
    v_caja_mediana UUID := gen_random_uuid();
    v_caja_grande UUID := gen_random_uuid();
    v_servilletas UUID := gen_random_uuid();

    -- UUIDs para Insumos Base
    v_masa UUID := gen_random_uuid();
    v_salsa UUID := gen_random_uuid();
    v_queso UUID := gen_random_uuid();

    -- UUIDs para Toppings
    v_pepperoni UUID := gen_random_uuid();
    v_jamon UUID := gen_random_uuid();
    v_carne UUID := gen_random_uuid();
    v_pollo UUID := gen_random_uuid();
    v_extra_queso UUID := gen_random_uuid();
    v_maiz UUID := gen_random_uuid();
    v_pina UUID := gen_random_uuid();
    v_jalapenos UUID := gen_random_uuid();
    v_aceitunas UUID := gen_random_uuid();
    v_cebolla_pimenton UUID := gen_random_uuid();

    -- UUIDs para Tamaños
    v_tamano_personal UUID := gen_random_uuid();
    v_tamano_mediana UUID := gen_random_uuid();
    v_tamano_grande UUID := gen_random_uuid();

BEGIN
    -- 1. Insertar Insumos e Ingredientes (Stock simulado de 10,000 para pruebas sin alertas rojas)
    INSERT INTO ingredientes (id, nombre, stock_actual, punto_reorden, unidad_medida) VALUES
    -- Base
    (v_masa, 'Masa (Bollo crudo)', 15000, 2000, 'gr'),
    (v_salsa, 'Salsa de Tomate', 10000, 1500, 'gr'),
    (v_queso, 'Queso Mozzarella', 15000, 2000, 'gr'),
    -- Toppings
    (v_pepperoni, 'Pepperoni', 5000, 500, 'gr'),
    (v_jamon, 'Jamón (Picado/Tiras)', 5000, 500, 'gr'),
    (v_carne, 'Carne Molida', 5000, 500, 'gr'),
    (v_pollo, 'Pechuga de Pollo', 5000, 500, 'gr'),
    (v_extra_queso, 'Extra Queso', 5000, 500, 'gr'),
    (v_maiz, 'Maíz Tierno', 5000, 500, 'gr'),
    (v_pina, 'Piña en Almíbar', 5000, 500, 'gr'),
    (v_jalapenos, 'Jalapeños', 3000, 300, 'gr'),
    (v_aceitunas, 'Aceitunas Negras', 3000, 300, 'gr'),
    (v_cebolla_pimenton, 'Cebolla / Pimentón', 4000, 400, 'gr'),
    -- Empaques
    (v_caja_personal, 'Cajas Personal', 200, 30, 'und'),
    (v_caja_mediana, 'Cajas Mediana', 200, 30, 'und'),
    (v_caja_grande, 'Cajas Grande', 150, 20, 'und'),
    (v_servilletas, 'Servilletas', 1000, 200, 'und');

    -- 2. Insertar Tamaños de Pizza
    -- Personal (25cm)
    INSERT INTO tamanos_pizza (id, nombre, masa_gr, salsa_gr, queso_base_gr, caja_id, servilletas_und) 
    VALUES (v_tamano_personal, 'Personal (25cm)', 250, 90, 80, v_caja_personal, 1);
    
    -- Mediana (35cm)
    INSERT INTO tamanos_pizza (id, nombre, masa_gr, salsa_gr, queso_base_gr, caja_id, servilletas_und) 
    VALUES (v_tamano_mediana, 'Mediana (35cm)', 500, 180, 160, v_caja_mediana, 3);
    
    -- Grande (45cm)
    INSERT INTO tamanos_pizza (id, nombre, masa_gr, salsa_gr, queso_base_gr, caja_id, servilletas_und) 
    VALUES (v_tamano_grande, 'Grande (45cm)', 800, 300, 260, v_caja_grande, 5);

    -- 3. Insertar Recetas (Porciones por topping para cada tamaño)
    INSERT INTO recetas_toppings (ingrediente_id, tamano_id, porcion_gr) VALUES
    -- Pepperoni
    (v_pepperoni, v_tamano_personal, 25), (v_pepperoni, v_tamano_mediana, 50), (v_pepperoni, v_tamano_grande, 80),
    -- Jamón
    (v_jamon, v_tamano_personal, 30), (v_jamon, v_tamano_mediana, 60), (v_jamon, v_tamano_grande, 100),
    -- Carne Molida
    (v_carne, v_tamano_personal, 35), (v_carne, v_tamano_mediana, 70), (v_carne, v_tamano_grande, 110),
    -- Pechuga de Pollo
    (v_pollo, v_tamano_personal, 35), (v_pollo, v_tamano_mediana, 70), (v_pollo, v_tamano_grande, 110),
    -- Extra Queso
    (v_extra_queso, v_tamano_personal, 40), (v_extra_queso, v_tamano_mediana, 80), (v_extra_queso, v_tamano_grande, 130),
    -- Maíz Tierno
    (v_maiz, v_tamano_personal, 35), (v_maiz, v_tamano_mediana, 70), (v_maiz, v_tamano_grande, 115),
    -- Piña en Almíbar
    (v_pina, v_tamano_personal, 40), (v_pina, v_tamano_mediana, 80), (v_pina, v_tamano_grande, 130),
    -- Jalapeños
    (v_jalapenos, v_tamano_personal, 20), (v_jalapenos, v_tamano_mediana, 40), (v_jalapenos, v_tamano_grande, 65),
    -- Aceitunas Negras
    (v_aceitunas, v_tamano_personal, 20), (v_aceitunas, v_tamano_mediana, 40), (v_aceitunas, v_tamano_grande, 65),
    -- Cebolla / Pimentón
    (v_cebolla_pimenton, v_tamano_personal, 30), (v_cebolla_pimenton, v_tamano_mediana, 60), (v_cebolla_pimenton, v_tamano_grande, 100);

END $$;
