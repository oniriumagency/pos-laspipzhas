import { getSaboresConIngredientes } from '@/server/actions/recipes';
import SaboresManager from '@/components/sabores/SaboresManager';

export default async function SaboresPage() {
  const { sabores, relaciones, ingredientes } = await getSaboresConIngredientes();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Recetas de Sabores</h1>
        <p className="text-gray-500 font-medium mt-1 text-lg">
          Gestiona los sabores de pizza y los ingredientes que componen cada uno.
        </p>
      </header>

      <SaboresManager
        sabores={sabores}
        relaciones={relaciones}
        ingredientes={ingredientes}
      />
    </div>
  );
}
