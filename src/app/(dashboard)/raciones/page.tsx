import { getRacionesData } from '@/server/actions/raciones';
import RacionesEditor from '@/components/raciones/RacionesEditor';

export default async function RacionesPage() {
  const { tamanos, ingredientes, recetas } = await getRacionesData();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Raciones por Pizza</h1>
        <p className="text-gray-500 font-medium mt-1 text-lg">
          Define cuántos gramos de cada ingrediente se gastan por tamaño de pizza. Edita los valores y guarda los cambios.
        </p>
      </header>

      <RacionesEditor 
        tamanos={tamanos} 
        ingredientes={ingredientes} 
        recetas={recetas} 
      />
    </div>
  );
}
