-- 01_historial_ventas.sql
-- Este script crea la tabla de ventas y actualiza las funciones de procesamiento de ventas.

-- 1. Crear la tabla de ventas
CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    total_precio NUMERIC NOT NULL,
    cart_payload JSONB NOT NULL,
    deducciones JSONB NOT NULL
);

-- Habilitar RLS en ventas
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;

-- Política sencilla para permitir que cualquier usuario autenticado vea y cree ventas
CREATE POLICY "Permitir todo a usuarios autenticados" ON ventas
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. Refactorizar la función procesar_venta para registrar la venta
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
        
        SELECT masa_gr, salsa_gr, queso_base_gr, caja_id, servilletas_und 
        INTO v_tamano 
        FROM tamanos_pizza 
        WHERE id = cart_item.tamano_id;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Tamaño de pizza no existe en el sistema.';
        END IF;

        -- Descontar Base
        INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_id_masa, (v_tamano.masa_gr * cart_item.cantidad)) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
        INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_id_salsa, (v_tamano.salsa_gr * cart_item.cantidad)) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
        INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_id_queso, (v_tamano.queso_base_gr * cart_item.cantidad)) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
        INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_tamano.caja_id, (1 * cart_item.cantidad)) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
        INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_id_servilletas, (v_tamano.servilletas_und * cart_item.cantidad)) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;

        -- Descontar Mitad 1
        IF jsonb_array_length(cart_item.mitad_1) > 0 THEN
            FOR v_topping IN SELECT * FROM jsonb_to_recordset(cart_item.mitad_1) AS t(ingrediente_id UUID) LOOP
                SELECT porcion_gr INTO v_porcion_gr FROM recetas_toppings WHERE ingrediente_id = v_topping.ingrediente_id AND tamano_id = cart_item.tamano_id;
                v_deduccion := (v_porcion_gr / 2.0) * cart_item.cantidad;
                INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_topping.ingrediente_id, v_deduccion) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
            END LOOP;
        END IF;

        -- Descontar Mitad 2
        IF jsonb_array_length(cart_item.mitad_2) > 0 THEN
            FOR v_topping IN SELECT * FROM jsonb_to_recordset(cart_item.mitad_2) AS t(ingrediente_id UUID) LOOP
                SELECT porcion_gr INTO v_porcion_gr FROM recetas_toppings WHERE ingrediente_id = v_topping.ingrediente_id AND tamano_id = cart_item.tamano_id;
                v_deduccion := (v_porcion_gr / 2.0) * cart_item.cantidad;
                INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_topping.ingrediente_id, v_deduccion) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
            END LOOP;
        END IF;

        -- Descontar Extras
        IF jsonb_array_length(cart_item.extras) > 0 THEN
            FOR v_topping IN SELECT * FROM jsonb_to_recordset(cart_item.extras) AS t(ingrediente_id UUID) LOOP
                SELECT porcion_gr INTO v_porcion_gr FROM recetas_toppings WHERE ingrediente_id = v_topping.ingrediente_id AND tamano_id = cart_item.tamano_id;
                v_deduccion := (v_porcion_gr) * cart_item.cantidad;
                INSERT INTO temp_deducciones (ing_id, cantidad_descontar) VALUES (v_topping.ingrediente_id, v_deduccion) ON CONFLICT (ing_id) DO UPDATE SET cantidad_descontar = temp_deducciones.cantidad_descontar + EXCLUDED.cantidad_descontar;
            END LOOP;
        END IF;

    END LOOP;

    -- Construir JSONB de deducciones
    SELECT jsonb_agg(jsonb_build_object('ing_id', ing_id, 'cantidad_descontar', cantidad_descontar))
    INTO v_deducciones_json
    FROM temp_deducciones
    WHERE cantidad_descontar > 0;

    -- Si no hubo deducciones por alguna razon, evitamos nulos
    IF v_deducciones_json IS NULL THEN
        v_deducciones_json := '[]'::jsonb;
    END IF;

    -- Insertar Venta
    INSERT INTO ventas (created_by, total_precio, cart_payload, deducciones)
    VALUES (p_user_id, p_total_precio, cart_payload, v_deducciones_json)
    RETURNING id INTO v_venta_id;

    -- Ejecutar el UPDATE masivo atómico en ingredientes
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


-- 3. Crear función para revertir la venta
CREATE OR REPLACE FUNCTION revertir_venta(p_venta_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_venta RECORD;
    v_item RECORD;
BEGIN
    -- Cargar datos de la venta
    SELECT * INTO v_venta FROM ventas WHERE id = p_venta_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Venta no encontrada.');
    END IF;

    -- Iterar sobre las deducciones almacenadas para revertirlas
    FOR v_item IN SELECT * FROM jsonb_to_recordset(v_venta.deducciones) AS x(ing_id UUID, cantidad_descontar NUMERIC) LOOP
        -- Restaurar inventario
        UPDATE ingredientes
        SET stock_actual = stock_actual + v_item.cantidad_descontar,
            updated_at = NOW()
        WHERE id = v_item.ing_id;

        -- Registrar en el historial como ajuste (reversión de venta cancelada)
        INSERT INTO historial_inventario (ingrediente_id, cantidad_cambio, tipo_movimiento, created_by)
        VALUES (v_item.ing_id, v_item.cantidad_descontar, 'ajuste', p_user_id);
    END LOOP;

    -- Eliminar la venta de la tabla de ventas
    DELETE FROM ventas WHERE id = p_venta_id;

    RETURN jsonb_build_object('success', true, 'message', 'Venta cancelada y stock restaurado.');
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
