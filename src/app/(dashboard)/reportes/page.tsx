import { getVentas } from '@/server/actions/ventas';
import ReportesDashboard from '@/components/reportes/ReportesDashboard';

export const metadata = {
  title: 'Reportes y Analíticas | Pipzhas POS',
};

export const dynamic = 'force-dynamic';

export default async function ReportesPage() {
  const ventas = await getVentas();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="text-3xl font-black md:text-4xl text-gray-900 tracking-tight">Analítica de Ventas</h1>
        <p className="text-gray-500 font-medium mt-2 text-lg max-w-2xl">
          Visualiza el rendimiento financiero del negocio, compara ingresos por canales de venta y evalúa la evolución temporal.
        </p>
      </header>

      <ReportesDashboard ventas={ventas} />
    </div>
  );
}
