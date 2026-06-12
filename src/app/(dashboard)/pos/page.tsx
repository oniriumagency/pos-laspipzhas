import { createClient } from '@/lib/supabase/server';
import { PosViewManager } from '@/components/pos/PosViewManager';
import { Topping, Sabor } from '@/store/usePosStore';

export default async function POSPage() {
  const supabase = await createClient();

  // Fetch tamaños de pizza
  const { data: tamanos } = await supabase
    .from('tamanos_pizza')
    .select('*')
    .order('created_at', { ascending: true });

  // Fetch sabores
  const { data: sabores } = await supabase
    .from('sabores')
    .select('*')
    .order('nombre', { ascending: true });

  // Fetch toppings disponibles para extras (excluye insumos base y empaques)
  const { data: ingredientes } = await supabase
    .from('ingredientes')
    .select('id, nombre')
    .neq('nombre', 'Masa') // Filtros simples para obviar insumos base en la UI
    .neq('nombre', 'Salsa')
    .neq('nombre', 'Queso')
    .neq('nombre', 'Cajas Mediana')
    .neq('nombre', 'Servilletas');

  // Fetch productos activos (gaseosas, cervezas, bebidas)
  const { data: productos } = await supabase
    .from('productos')
    .select('id, nombre, precio, categoria')
    .eq('activo', true)
    .order('categoria', { ascending: true })
    .order('nombre', { ascending: true });

  const toppings: Topping[] = (ingredientes || []).map(ing => ({
    ingrediente_id: ing.id,
    nombre: ing.nombre,
  }));

  const saboresList: Sabor[] = sabores || [];

  return (
    <PosViewManager
      tamanos={tamanos || []}
      toppings={toppings}
      sabores={saboresList}
      productos={productos || []}
    />
  );
}
