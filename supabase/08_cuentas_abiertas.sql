-- 08_cuentas_abiertas.sql
-- Tabla para almacenar el estado de las cuentas (mesas/pedidos) abiertas en el servidor.

CREATE TABLE IF NOT EXISTS cuentas_abiertas (
    id UUID PRIMARY KEY, -- Usamos el mismo UUID generado en el cliente
    nombre TEXT NOT NULL,
    origen_venta TEXT,
    cart JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id) -- Opcional, si hay autenticación
);

-- Habilitar RLS
ALTER TABLE cuentas_abiertas ENABLE ROW LEVEL SECURITY;

-- Política para permitir que los usuarios (autenticados o anónimos dependiendo de la configuración del proyecto) gestionen las cuentas
-- Por el momento se asume que al igual que "ventas" todos los autenticados tienen acceso, o si no hay auth fuerte, true para todos.
-- Verificamos que la política "Permitir todo a usuarios autenticados" es similar a otras.
CREATE POLICY "Permitir acceso total a cuentas_abiertas" ON cuentas_abiertas
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION actualizar_updated_at_cuentas_abiertas()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_updated_at_cuentas_abiertas ON cuentas_abiertas;
CREATE TRIGGER trigger_actualizar_updated_at_cuentas_abiertas
    BEFORE UPDATE ON cuentas_abiertas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_updated_at_cuentas_abiertas();
