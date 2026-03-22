import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-6">
      <div>
        <div className="text-6xl font-bold text-muted-foreground/20 mb-4">404</div>
        <h1 className="text-xl font-semibold mb-2">Page not found</h1>
        <p className="text-muted-foreground mb-6">This page doesn&apos;t exist or has been moved.</p>
        <Link href="/" className="text-sm underline underline-offset-4 hover:text-muted-foreground transition-colors">
          Go home
        </Link>
      </div>
    </div>
  );
}
