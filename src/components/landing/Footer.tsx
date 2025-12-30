import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t py-8 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
          </nav>
          <p className="text-sm text-muted-foreground">
            &copy; 2026 StaticKit
          </p>
        </div>
      </div>
    </footer>
  );
}
