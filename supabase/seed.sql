-- seed.sql: Carga de Datos Iniciales para Las Pipzhas

DO $$
DECLARE
    -- Declaramos variables para capturar los UUIDs de los ingredientes base
    v_id_masa UUID := gen_random_uuid();
    v_id_salsa UUID := gen_random_uuid();
    v_id_queso UUID := gen_random_uuid();
    v_id_pepperoni UUID := gen_random_uuid();
    v_id_champinones UUID := gen_random_uuid();
    v_id_caja_mediana UUID := gen_random_uuid();
    v_id_servilletas UUID := gen_random_uuid();
    
    -- Declaramos variable para el tamaño
    v_id_tamano_mediana UUID := gen_random_uuid();
BEGIN
    -- 1. Insertar Ingredientes
    INSERT INTO ingredientes (id, nombre, stock_actual, punto_reorden, unidad_medida) VALUES
    -- Insumos base
    (v_id_masa, 'Masa', 5000, 1000, 'gr'),
    (v_id_salsa, 'Salsa', 5000, 1000, 'gr'),
    (v_id_queso, 'Queso Mozzarella', 5000, 1000, 'gr'),
    -- Toppings
    (v_id_pepperoni, 'Pepperoni', 5000, 500, 'gr'),
    (v_id_champinones, 'Champiñones', 5000, 500, 'gr'),
    -- Empaques
    (v_id_caja_mediana, 'Cajas Mediana', 100, 20, 'und'),
    (v_id_servilletas, 'Servilletas', 100, 20, 'und');

    -- 2. Insertar Tamaño (Mediana)
    -- Referenciamos la caja mediana a través de la variable v_id_caja_mediana
    INSERT INTO tamanos_pizza (id, nombre, masa_gr, salsa_gr, queso_base_gr, caja_id, servilletas_und) VALUES
    (v_id_tamano_mediana, 'Mediana', 500, 180, 160, v_id_caja_mediana, 3);

    -- 3. Insertar Recetas Toppings
    -- Referenciamos los ingredientes y el tamaño por las variables de UUID generadas
    INSERT INTO recetas_toppings (ingrediente_id, tamano_id, porcion_gr) VALUES
    (v_id_pepperoni, v_id_tamano_mediana, 50),
    (v_id_champinones, v_id_tamano_mediana, 70);

END $$;
