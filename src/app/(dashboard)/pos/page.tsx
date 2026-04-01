import { createClient } from '@/lib/supabase/server';
import { MenuDisplay } from '@/components/pos/MenuDisplay';
import { CartSidebar } from '@/components/pos/CartSidebar';
import { CartToggle } from '@/components/pos/CartToggle';
import { Topping, Sabor } from '@/store/usePosStore';

export default async function POSPage() {
  const supabase = await createClient();

  // Fetch tamanos de pizza
  const { data: tamanos } = await supabase
    .from('tamanos_pizza')
    .select('*')
    .order('created_at', { ascending: true });
    
  // Fetch sabores
  const { data: sabores } = await supabase
    .from('sabores')
    .select('*')
    .order('nombre', { ascending: true });

  // Fetch toppings disponibles para extras
  const { data: ingredientes } = await supabase
    .from('ingredientes')
    .select('id, nombre')
    .neq('nombre', 'Masa') // Filtros simples para obviar insumos base en la UI
    .neq('nombre', 'Salsa')
    .neq('nombre', 'Queso')
    .neq('nombre', 'Cajas Mediana')
    .neq('nombre', 'Servilletas');

  const toppings: Topping[] = (ingredientes || []).map(ing => ({
    ingrediente_id: ing.id,
    nombre: ing.nombre
  }));

  const saboresList: Sabor[] = sabores || [];

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden relative">
      {/* Contenido Principal (Grill de Productos) */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto transition-all duration-300">
        <header className="px-6 py-5 bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Nueva Venta</h1>
            <p className="text-sm text-slate-500 mt-1">Selecciona el tamaño y configura la pizza.</p>
          </div>
          <CartToggle />
        </header>

        <div className="p-6">
          <MenuDisplay tamanos={tamanos || []} toppings={toppings} sabores={saboresList} />
        </div>
      </main>

      {/* Sidebar del Carrito - Fija a la derecha en Desktop, Modal/Flotante en Mobile */}
      <CartSidebar />
    </div>
  );
}
