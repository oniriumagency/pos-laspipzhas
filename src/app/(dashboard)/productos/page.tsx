import { getTodosLosProductos } from '@/server/actions/productos';
import { ProductosManager } from '@/components/productos/ProductosManager';

// Este React Server Component obtiene todos los productos (activos e inactivos)
// del lado del servidor y delega la UI reactiva al Client Component ProductosManager.
export default async function ProductosPage() {
  const productos = await getTodosLosProductos();

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Productos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gestiona el catálogo de bebidas y otros productos vendibles desde el POS.
        </p>
      </div>

      <ProductosManager productos={productos} />
    </div>
  );
}
