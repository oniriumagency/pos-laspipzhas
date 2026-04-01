-- rpc_procesar_venta.sql
-- Función ATÓMICA para deducir inventario basado en un carrito complejo de pizzas.

CREATE OR REPLACE FUNCTION procesar_venta(cart_payload JSONB, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
-- Se ejecuta con permisos de Security Definer para evadir RLS si fuera necesario, 
-- aunque el usuario estará autenticado.
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
    v_nombre TEXT;
BEGIN
    -- 1. Identificar UUIDs de ingredientes base (Por nombre estandarizado)
    SELECT id INTO v_id_masa FROM ingredientes WHERE nombre = 'Masa (Bollo crudo)' LIMIT 1;
    SELECT id INTO v_id_salsa FROM ingredientes WHERE nombre = 'Salsa de Tomate' LIMIT 1;
    SELECT id INTO v_id_queso FROM ingredientes WHERE nombre = 'Queso Mozzarella' LIMIT 1;
    SELECT id INTO v_id_servilletas FROM ingredientes WHERE nombre = 'Servilletas' LIMIT 1;

    -- 2. Crear tabla temporal para consolidar todas las deducciones y no hacer UPDATEs redundantes
    CREATE TEMP TABLE IF NOT EXISTS temp_deducciones (
        ing_id UUID PRIMARY KEY,
        cantidad_descontar NUMERIC DEFAULT 0
    ) ON COMMIT DROP;

    TRUNCATE temp_deducciones;

    -- Función Helper anónima para agregar a la tabla temporal
    -- (En PL/pgSQL lo hacemos con un simple INSERT ... ON CONFLICT)

    -- 3. Iterar por cada elemento del carrito (JSON Array)
    FOR cart_item IN SELECT * FROM jsonb_to_recordset(cart_payload) AS x(
        tamano_id UUID, 
        cantidad INTEGER, 
        mitad_1 JSONB, 
        mitad_2 JSONB, 
        extras JSONB
    ) LOOP
        
        -- A. Obtener reglas de la base de este tamaño
        SELECT masa_gr, salsa_gr, queso_base_gr, caja_id, servilletas_und 
        INTO v_tamano 
        FROM tamanos_pizza 
        WHERE id = cart_item.tamano_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Tamaño de pizza no existe en el sistema.';
        END IF;

        -- B. Descontar Base (Multiplicado por la cantidad comprada de esta configuración)
        INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_id_masa, (v_tamano.masa_gr * cart_item.cantidad)) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
        INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_id_salsa, (v_tamano.salsa_gr * cart_item.cantidad)) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
        INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_id_queso, (v_tamano.queso_base_gr * cart_item.cantidad)) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
        INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_tamano.caja_id, (1 * cart_item.cantidad)) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
        INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_id_servilletas, (v_tamano.servilletas_und * cart_item.cantidad)) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;

        -- C. Descontar Mitad 1 (Se divide la porción entre 2)
        IF jsonb_array_length(cart_item.mitad_1) > 0 THEN
            FOR v_topping IN SELECT * FROM jsonb_to_recordset(cart_item.mitad_1) AS t(ingrediente_id UUID) LOOP
                SELECT porcion_gr INTO v_porcion_gr FROM recetas_toppings WHERE ingrediente_id = v_topping.ingrediente_id AND tamano_id = cart_item.tamano_id;
                v_deduccion := (v_porcion_gr / 2.0) * cart_item.cantidad;
                INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_topping.ingrediente_id, v_deduccion) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
            END LOOP;
        END IF;

        -- D. Descontar Mitad 2 (Se divide la porción entre 2)
        IF jsonb_array_length(cart_item.mitad_2) > 0 THEN
            FOR v_topping IN SELECT * FROM jsonb_to_recordset(cart_item.mitad_2) AS t(ingrediente_id UUID) LOOP
                SELECT porcion_gr INTO v_porcion_gr FROM recetas_toppings WHERE ingrediente_id = v_topping.ingrediente_id AND tamano_id = cart_item.tamano_id;
                v_deduccion := (v_porcion_gr / 2.0) * cart_item.cantidad;
                INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_topping.ingrediente_id, v_deduccion) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
            END LOOP;
        END IF;

        -- E. Descontar Extras (Porción Completa)
        IF jsonb_array_length(cart_item.extras) > 0 THEN
            FOR v_topping IN SELECT * FROM jsonb_to_recordset(cart_item.extras) AS t(ingrediente_id UUID) LOOP
                SELECT porcion_gr INTO v_porcion_gr FROM recetas_toppings WHERE ingrediente_id = v_topping.ingrediente_id AND tamano_id = cart_item.tamano_id;
                v_deduccion := (v_porcion_gr) * cart_item.cantidad;
                INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_topping.ingrediente_id, v_deduccion) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
            END LOOP;
        END IF;

    END LOOP;

    -- 4. Ejecutar el UPDATE masivo atómico en ingredientes y verificar validación de stock (Evitar negativos)
    FOR v_ing, v_cant IN SELECT ing_id, cantidad_descontar FROM temp_deducciones LOOP
        IF v_cant > 0 THEN
            -- Opcional: Podrías validar aquí si `(stock_actual - v_cant) < 0` para lanzar error,
            -- pero en POS de comida se suele permitir negativos para ajustes en bodega. Asumiremos permitir.
            
            -- Actualizar Stock
            UPDATE ingredientes 
            SET stock_actual = stock_actual - v_cant,
                updated_at = NOW()
            WHERE id = v_ing;
            
            -- Insertar Historial
            INSERT INTO historial_inventario (ingrediente_id, cantidad_cambio, tipo_movimiento, created_by)
            VALUES (v_ing, -v_cant, 'venta', p_user_id);
        END IF;
    END LOOP;

    -- Operación Exitosa
    RETURN jsonb_build_object('success', true, 'message', 'Inventario deducido correctamente');

EXCEPTION WHEN OTHERS THEN
    -- Si ALGO falla, Postgres deshace ABSOLUTAMENTE TODO de forma transaccional.
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
