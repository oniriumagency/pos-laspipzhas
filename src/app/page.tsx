import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirigimos automáticamente a /login para evitar el Error 404
  redirect('/login');
}
