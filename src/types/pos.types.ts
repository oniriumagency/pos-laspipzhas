export interface TamanoPizza {
  id: string;
  nombre: string;
  precio_base: number;
}

export interface Ingrediente {
  id: string;
  nombre: string;
  precio_adicional: number;
  categoria: 'salsa' | 'queso' | 'carne' | 'vegetal' | 'extra';
}

export interface ProductoBase {
  id: string;
  nombre: string;
  descripcion?: string;
  es_pizza: boolean;
}

export type TipoArmado = 'completa' | 'mitad_y_mitad';

export interface CartItem {
  id: string; // Identificador en el carrito generado con crypto.randomUUID()
  productoBase: ProductoBase | null; // El producto seleccionado
  tamano: TamanoPizza | null; // Referencia a tamanos_pizza
  tipoArmado: TipoArmado; // Completa o Mitad y Mitad
  mitad1: Ingrediente[]; // Ingredientes para toda la pizza o la mitad 1
  mitad2: Ingrediente[]; // Array vacío si es "completa"
  extras: Ingrediente[]; // Extras para toda la pizza
  cantidad: number;
  precioUnitarioCalculado: number;
  precioTotalCalculado: number;
}
