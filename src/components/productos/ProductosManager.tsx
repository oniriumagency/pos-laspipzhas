'use client';

import { useState, useTransition } from 'react';
import {
  crearProducto,
  actualizarProducto,
  desactivarProducto,
  reactivarProducto,
  Producto,
  CategoriaProducto,
} from '@/server/actions/productos';
import {
  PlusCircle, Pencil, Trash2, RotateCcw, X, Save,
  Beer, Grape, Droplets, Package, Pizza, Flame,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Configuración de categorías ─────────────────────────────────────────────

const CATEGORIAS: { valor: CategoriaProducto; etiqueta: string; icono: React.ElementType; color: string }[] = [
  { valor: 'pizza',      etiqueta: 'Pizza',      icono: Pizza,    color: 'text-orange-500 bg-orange-50' },
  { valor: 'gaseosa',    etiqueta: 'Gaseosa',    icono: Grape,    color: 'text-purple-500 bg-purple-50' },
  { valor: 'cerveza',    etiqueta: 'Cerveza',    icono: Beer,     color: 'text-amber-500 bg-amber-50'   },
  { valor: 'bebida',     etiqueta: 'Bebida',     icono: Droplets, color: 'text-cyan-500 bg-cyan-50'     },
  { valor: 'cigarrillo', etiqueta: 'Cigarrillos', icono: Flame,    color: 'text-slate-600 bg-slate-100'  },
];

const obtenerEstiloCategoria = (categoria: CategoriaProducto) =>
  CATEGORIAS.find((c) => c.valor === categoria) ?? CATEGORIAS[0];

// ─── Estado inicial para el formulario de creación/edición ───────────────────

const FORM_INICIAL = {
  nombre:    '',
  precio:    '',
  categoria: 'gaseosa' as CategoriaProducto,
};

// ─── Componente Principal ─────────────────────────────────────────────────────

export function ProductosManager({ productos }: { productos: Producto[] }) {
  const [listadoProductos, setListadoProductos] = useState<Producto[]>(productos);
  const [isPending, startTransition] = useTransition();

  // ── Estado del formulario de creación ────────────────────────────────────
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [formCrear, setFormCrear] = useState(FORM_INICIAL);

  // ── Estado del formulario de edición ─────────────────────────────────────
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [formEditar, setFormEditar] = useState(FORM_INICIAL);

  // ── Estado para filtros ───────────────────────────────────────────────────
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<CategoriaProducto | 'todos'>('todos');

  const productosFiltrados = listadoProductos.filter((p) => {
    const pasaActivo = mostrarInactivos ? true : p.activo;
    const pasaCategoria = filtroCategoria === 'todos' || p.categoria === filtroCategoria;
    return pasaActivo && pasaCategoria;
  });

  // ─── Handlers: Crear ─────────────────────────────────────────────────────

  const abrirModalCrear = () => {
    setFormCrear(FORM_INICIAL);
    setModalCrearAbierto(true);
  };

  const handleCrear = () => {
    const precio = Number(formCrear.precio);
    if (!formCrear.nombre.trim()) {
      toast.error('El nombre del producto es obligatorio.');
      return;
    }
    if (isNaN(precio) || precio <= 0) {
      toast.error('Ingresa un precio válido mayor a cero.');
      return;
    }

    startTransition(async () => {
      const resultado = await crearProducto(formCrear.nombre, precio, formCrear.categoria);
      if (resultado.success) {
        toast.success(`Producto "${formCrear.nombre}" creado correctamente.`);
        setModalCrearAbierto(false);
        // Agregar el nuevo producto al estado local de forma optimista
        setListadoProductos((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            nombre: formCrear.nombre.trim(),
            precio,
            categoria: formCrear.categoria,
            activo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      } else {
        toast.error(resultado.error || 'Error al crear el producto.');
      }
    });
  };

  // ─── Handlers: Editar ─────────────────────────────────────────────────────

  const abrirEdicion = (producto: Producto) => {
    setProductoEditando(producto);
    setFormEditar({
      nombre:    producto.nombre,
      precio:    String(producto.precio),
      categoria: producto.categoria,
    });
  };

  const handleGuardarEdicion = () => {
    if (!productoEditando) return;
    const precio = Number(formEditar.precio);
    if (!formEditar.nombre.trim()) {
      toast.error('El nombre del producto es obligatorio.');
      return;
    }
    if (isNaN(precio) || precio <= 0) {
      toast.error('Ingresa un precio válido mayor a cero.');
      return;
    }

    startTransition(async () => {
      const resultado = await actualizarProducto(
        productoEditando.id,
        formEditar.nombre,
        precio,
        formEditar.categoria
      );
      if (resultado.success) {
        toast.success('Producto actualizado correctamente.');
        setListadoProductos((prev) =>
          prev.map((p) =>
            p.id === productoEditando.id
              ? { ...p, nombre: formEditar.nombre.trim(), precio, categoria: formEditar.categoria }
              : p
          )
        );
        setProductoEditando(null);
      } else {
        toast.error(resultado.error || 'Error al actualizar el producto.');
      }
    });
  };

  // ─── Handlers: Desactivar / Reactivar ────────────────────────────────────

  const handleDesactivar = (producto: Producto) => {
    if (!window.confirm(`¿Deseas desactivar "${producto.nombre}"?\nDejarará de aparecer en el POS pero el historial de ventas se conservará.`)) {
      return;
    }
    startTransition(async () => {
      const resultado = await desactivarProducto(producto.id);
      if (resultado.success) {
        toast.success(`"${producto.nombre}" desactivado.`);
        setListadoProductos((prev) =>
          prev.map((p) => (p.id === producto.id ? { ...p, activo: false } : p))
        );
      } else {
        toast.error(resultado.error || 'Error al desactivar el producto.');
      }
    });
  };

  const handleReactivar = (producto: Producto) => {
    startTransition(async () => {
      const resultado = await reactivarProducto(producto.id);
      if (resultado.success) {
        toast.success(`"${producto.nombre}" reactivado en el POS.`);
        setListadoProductos((prev) =>
          prev.map((p) => (p.id === producto.id ? { ...p, activo: true } : p))
        );
      } else {
        toast.error(resultado.error || 'Error al reactivar el producto.');
      }
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      {/* ── Barra de acciones y filtros ── */}
      <div className="flex flex-wrap gap-3 mb-6 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {/* Filtro por categoría */}
          <button
            onClick={() => setFiltroCategoria('todos')}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${filtroCategoria === 'todos' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
          >
            Todos
          </button>
          {CATEGORIAS.map((cat) => {
            const Icono = cat.icono;
            return (
              <button
                key={cat.valor}
                onClick={() => setFiltroCategoria(cat.valor)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${filtroCategoria === cat.valor ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                <Icono size={14} />
                {cat.etiqueta}
              </button>
            );
          })}
          {/* Toggle inactivos */}
          <button
            onClick={() => setMostrarInactivos(!mostrarInactivos)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${mostrarInactivos ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}
          >
            {mostrarInactivos ? 'Ocultar inactivos' : 'Ver inactivos'}
          </button>
        </div>

        <button
          id="boton-nuevo-producto"
          onClick={abrirModalCrear}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors shadow-sm shadow-orange-500/20 disabled:opacity-50"
        >
          <PlusCircle size={16} />
          Nuevo Producto
        </button>
      </div>

      {/* ── Tabla de productos ── */}
      <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {productosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package size={48} className="mb-3 opacity-30" />
            <p className="font-semibold">No hay productos en esta categoría.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr className="text-[0.65rem] uppercase font-black text-gray-400 tracking-widest">
                <th className="px-5 py-4">Producto</th>
                <th className="px-5 py-4">Categoría</th>
                <th className="px-5 py-4 text-right">Precio</th>
                <th className="px-5 py-4 text-center">Estado</th>
                <th className="px-5 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productosFiltrados.map((producto) => {
                const estiloCategoria = obtenerEstiloCategoria(producto.categoria);
                const IconoCategoria = estiloCategoria.icono;
                return (
                  <tr
                    key={producto.id}
                    className={`hover:bg-gray-50/50 transition-colors ${!producto.activo ? 'opacity-50' : ''}`}
                  >
                    <td className="px-5 py-4">
                      <span className={`font-semibold text-gray-800 ${!producto.activo ? 'line-through' : ''}`}>
                        {producto.nombre}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-bold ${estiloCategoria.color}`}>
                        <IconoCategoria size={12} />
                        {estiloCategoria.etiqueta}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-black text-gray-800">
                      ${producto.precio.toLocaleString('es-CO')}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${producto.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {producto.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 justify-end">
                        {/* Editar */}
                        <button
                          id={`editar-producto-${producto.id}`}
                          onClick={() => abrirEdicion(producto)}
                          disabled={isPending}
                          className="w-8 h-8 flex items-center justify-center border border-blue-200 bg-blue-50 text-blue-500 rounded-lg hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all disabled:opacity-40"
                          title="Editar producto"
                        >
                          <Pencil size={13} />
                        </button>
                        {/* Desactivar / Reactivar */}
                        {producto.activo ? (
                          <button
                            id={`desactivar-producto-${producto.id}`}
                            onClick={() => handleDesactivar(producto)}
                            disabled={isPending}
                            className="w-8 h-8 flex items-center justify-center border border-red-200 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:border-red-600 hover:text-white transition-all disabled:opacity-40"
                            title="Desactivar producto"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : (
                          <button
                            id={`reactivar-producto-${producto.id}`}
                            onClick={() => handleReactivar(producto)}
                            disabled={isPending}
                            className="w-8 h-8 flex items-center justify-center border border-green-200 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:border-green-600 hover:text-white transition-all disabled:opacity-40"
                            title="Reactivar producto"
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ═══ MODAL: Crear Producto ═══ */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Nuevo Producto</h3>
                <p className="text-sm text-slate-500 mt-1">Agrega una bebida u otro producto al catálogo del POS.</p>
              </div>
              <button
                onClick={() => setModalCrearAbierto(false)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <FormularioProducto
              form={formCrear}
              onChange={setFormCrear}
              isPending={isPending}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalCrearAbierto(false)}
                disabled={isPending}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                id="confirmar-crear-producto"
                onClick={handleCrear}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors disabled:opacity-40 shadow-lg shadow-orange-500/20"
              >
                <Save size={15} />
                {isPending ? 'Guardando...' : 'Crear Producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Editar Producto ═══ */}
      {productoEditando && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">Editar Producto</h3>
                <p className="text-sm text-slate-500 mt-1 truncate max-w-[16rem]">{productoEditando.nombre}</p>
              </div>
              <button
                onClick={() => setProductoEditando(null)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <FormularioProducto
              form={formEditar}
              onChange={setFormEditar}
              isPending={isPending}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setProductoEditando(null)}
                disabled={isPending}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                id="confirmar-editar-producto"
                onClick={handleGuardarEdicion}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-40 shadow-sm"
              >
                <Save size={15} />
                {isPending ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-componente: Formulario de Producto (reutilizado en Crear y Editar) ───

interface FormularioProductoProps {
  form: typeof FORM_INICIAL;
  onChange: (nuevo: typeof FORM_INICIAL) => void;
  isPending: boolean;
}

function FormularioProducto({ form, onChange, isPending }: FormularioProductoProps) {
  return (
    <div className="space-y-4">
      {/* Nombre */}
      <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
          Nombre del Producto
        </label>
        <input
          type="text"
          value={form.nombre}
          onChange={(e) => onChange({ ...form, nombre: e.target.value })}
          placeholder="Ej: Postobon Manzana 250ml"
          disabled={isPending}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50 disabled:opacity-50"
        />
      </div>

      {/* Precio */}
      <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
          Precio (COP)
        </label>
        <input
          type="number"
          min="0"
          step="500"
          value={form.precio}
          onChange={(e) => onChange({ ...form, precio: e.target.value })}
          placeholder="Ej: 2000"
          disabled={isPending}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-300 bg-slate-50 disabled:opacity-50"
        />
      </div>

      {/* Categoría */}
      <div>
        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
          Categoría
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {CATEGORIAS.map((cat) => {
            const Icono = cat.icono;
            const estaActiva = form.categoria === cat.valor;
            return (
              <button
                key={cat.valor}
                type="button"
                onClick={() => onChange({ ...form, categoria: cat.valor })}
                disabled={isPending}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-bold transition-all ${
                  estaActiva
                    ? 'border-orange-400 bg-orange-50 text-orange-600 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                } disabled:opacity-50`}
              >
                <Icono size={18} />
                {cat.etiqueta}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
