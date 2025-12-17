import { Link } from "@/i18n/navigation";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-slate-400">404</h1>
        <h2 className="text-2xl font-semibold text-white">Page non trouvée</h2>
        <p className="text-slate-400">
          La page que vous recherchez n'existe pas.
        </p>
        <Link href="/" className="btn btn-primary inline-flex">
          Retour à l'accueil
        </Link>
      </div>
    </main>
  );
}

