import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <div className="text-8xl font-bold gradient-text">404</div>
        <h2 className="text-2xl font-semibold">Page not found</h2>
        <p className="text-muted max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-accent to-accent-hot text-white rounded-xl font-medium hover:shadow-glow transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
