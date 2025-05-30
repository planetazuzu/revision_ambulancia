// Esto podría ser una página de bienvenida o redirigir al dashboard.
// Por ahora, redirigiremos al dashboard.
import { redirect } from 'next/navigation';

export default function CrmRootPage() {
  redirect('/gobiernodelarioja-crm/dashboard');
  return null; // La redirección ocurre en el servidor, esto no se renderizará.
}
