-- 03_fix_procesar_venta.sql
-- PARCHE: Corrige la lógica de deducción de inventario para que el descuento sea
-- completo si la pizza es de 1 solo sabor, y fraccionado (a la mitad) 
-- únicamente si tiene 2 mitades.

CREATE OR REPLACE FUNCTION procesar_venta(cart_payload JSONB, p_total_precio NUMERIC, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER 
AS $$
DECLARE
    -- Variables para IDs de insumos globales
    v_id_masa UUID;
    v_id_salsa UUID;
    v_id_queso UUID;
    v_id_servilletas UUID;
    
    -- Variables de iteración
    cart_item RECORD;
    v_tamano RECORD;
    v_topping RECORD;
    
    -- Cálculos
    v_porcion_gr NUMERIC;
    v_deduccion NUMERIC;
    v_ing UUID;
    v_cant NUMERIC;
    v_es_mitades BOOLEAN;
    
    -- Manejo de venta
    v_deducciones_json JSONB;
    v_venta_id UUID;
BEGIN
    -- Identificar UUIDs base
    SELECT id INTO v_id_masa FROM ingredientes WHERE nombre = 'Masa (Bollo crudo)' LIMIT 1;
    SELECT id INTO v_id_salsa FROM ingredientes WHERE nombre = 'Salsa de Tomate' LIMIT 1;
    SELECT id INTO v_id_queso FROM ingredientes WHERE nombre = 'Queso Mozzarella' LIMIT 1;
    SELECT id INTO v_id_servilletas FROM ingredientes WHERE nombre = 'Servilletas' LIMIT 1;

    CREATE TEMP TABLE IF NOT EXISTS temp_deducciones (
        ing_id UUID PRIMARY KEY,
        cantidad_descontar NUMERIC DEFAULT 0
    ) ON COMMIT DROP;

    TRUNCATE temp_deducciones;

    -- Iterar por el carrito
    FOR cart_item IN SELECT * FROM jsonb_to_recordset(cart_payload) AS x(
        tamano_id UUID, 
        cantidad INTEGER, 
        mitad_1 JSONB, 
        mitad_2 JSONB, 
        extras JSONB
    ) LOOP
        
        -- Obtener datos base del tamaño
        SELECT masa_gr, salsa_gr, queso_base_gr, caja_id, servilletas_und 
        INTO v_tamano 
        FROM tamanos_pizza 
        WHERE id = cart_item.tamano_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Tamaño de pizza no existe en el sistema.';
        END IF;

        -- Determinar si esta orden específica es de "Mitad y Mitad"
        -- Es mitades si el array JSON de mitad_2 tiene elementos
        v_es_mitades := jsonb_array_length(cart_item.mitad_2) > 0;

        -- Descontar INSUMOS BASE (Se descuentan por completo multiplicados por la cantidad)
        INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_id_masa, (v_tamano.masa_gr * cart_item.cantidad)) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
        INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_id_salsa, (v_tamano.salsa_gr * cart_item.cantidad)) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
        INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_id_queso, (v_tamano.queso_base_gr * cart_item.cantidad)) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
        INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_tamano.caja_id, (1 * cart_item.cantidad)) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
        INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_id_servilletas, (v_tamano.servilletas_und * cart_item.cantidad)) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;

        -- LÓGICA DE DEDUCCIÓN DINÁMICA DE TOPPINGS
        IF v_es_mitades THEN
            -- Descontar Mitad 1 (Se divide la porción entre 2)
            IF jsonb_array_length(cart_item.mitad_1) > 0 THEN
                FOR v_topping IN SELECT * FROM jsonb_to_recordset(cart_item.mitad_1) AS t(ingrediente_id UUID) LOOP
                    SELECT porcion_gr INTO v_porcion_gr FROM recetas_toppings WHERE ingrediente_id = v_topping.ingrediente_id AND tamano_id = cart_item.tamano_id;
                    v_deduccion := (v_porcion_gr / 2.0) * cart_item.cantidad;
                    INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_topping.ingrediente_id, v_deduccion) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
                END LOOP;
            END IF;

            -- Descontar Mitad 2 (Se divide la porción entre 2)
            IF jsonb_array_length(cart_item.mitad_2) > 0 THEN
                FOR v_topping IN SELECT * FROM jsonb_to_recordset(cart_item.mitad_2) AS t(ingrediente_id UUID) LOOP
                    SELECT porcion_gr INTO v_porcion_gr FROM recetas_toppings WHERE ingrediente_id = v_topping.ingrediente_id AND tamano_id = cart_item.tamano_id;
                    v_deduccion := (v_porcion_gr / 2.0) * cart_item.cantidad;
                    INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_topping.ingrediente_id, v_deduccion) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
                END LOOP;
            END IF;
        ELSE
            -- ES COMPLETA DE 1 SOLO SABOR (No dividimos entre 2)
            IF jsonb_array_length(cart_item.mitad_1) > 0 THEN
                FOR v_topping IN SELECT * FROM jsonb_to_recordset(cart_item.mitad_1) AS t(ingrediente_id UUID) LOOP
                    SELECT porcion_gr INTO v_porcion_gr FROM recetas_toppings WHERE ingrediente_id = v_topping.ingrediente_id AND tamano_id = cart_item.tamano_id;
                    v_deduccion := (v_porcion_gr) * cart_item.cantidad;
                    INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_topping.ingrediente_id, v_deduccion) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
                END LOOP;
            END IF;
        END IF;

        -- Descontar Extras (Siempre es Porción Completa, no se dividen nunca)
        IF jsonb_array_length(cart_item.extras) > 0 THEN
            FOR v_topping IN SELECT * FROM jsonb_to_recordset(cart_item.extras) AS t(ingrediente_id UUID) LOOP
                SELECT porcion_gr INTO v_porcion_gr FROM recetas_toppings WHERE ingrediente_id = v_topping.ingrediente_id AND tamano_id = cart_item.tamano_id;
                v_deduccion := (v_porcion_gr) * cart_item.cantidad;
                INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_topping.ingrediente_id, v_deduccion) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
            END LOOP;
        END IF;

    END LOOP;

    -- Construir JSONB final para registrar la venta
    SELECT jsonb_agg(jsonb_build_object('ing_id', ing_id, 'cantidad_descontar', cantidad_descontar))
    INTO v_deducciones_json
    FROM temp_deducciones
    WHERE cantidad_descontar > 0;

    -- Si no hubo deducciones por alguna razon
    IF v_deducciones_json IS NULL THEN
        v_deducciones_json := '[]'::jsonb;
    END IF;

    -- Registrar venta en la nueva tabla
    INSERT INTO ventas (created_by, total_precio, cart_payload, deducciones)
    VALUES (p_user_id, p_total_precio, cart_payload, v_deducciones_json)
    RETURNING id INTO v_venta_id;

    -- Deducción Masiva y Atómica del STOCK REAL
    FOR v_ing, v_cant IN SELECT ing_id, cantidad_descontar FROM temp_deducciones LOOP
        IF v_cant > 0 THEN
            UPDATE ingredientes 
            SET stock_actual = stock_actual - v_cant,
                updated_at = NOW()
            WHERE id = v_ing;
            
            INSERT INTO historial_inventario (ingrediente_id, cantidad_cambio, tipo_movimiento, created_by)
            VALUES (v_ing, -v_cant, 'venta', p_user_id);
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'message', 'Venta procesada y registrada', 'venta_id', v_venta_id);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
