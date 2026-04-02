-- 02_fix_revertir_venta.sql
-- PARCHE: Corrige el constraint violation al cancelar ventas.
-- El tipo de movimiento 'ingreso' no existe en la tabla historial_inventario.
-- Usamos 'ajuste' que sí está permitido.
--
-- INSTRUCCIONES: Copia y pega SOLO ESTE BLOQUE en el SQL Editor de Supabase y ejecútalo.

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
