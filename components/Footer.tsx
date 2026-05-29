export function Footer() {
  return (
    <footer className="mx-auto max-w-content px-6 sm:px-8 py-16 mt-16 border-t border-line">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-serif text-base">ApplyOne</p>
          <p className="text-sm text-ink-soft mt-1 max-w-md leading-relaxed">
            Runs locally in your browser. Your résumé never leaves your device
            except to generate documents.
          </p>
        </div>
        <a
          href="https://github.com"
          target="_blank"
          rel="noreferrer noopener"
          className="text-sm text-ink-soft hover:text-ink transition-colors focus-ring rounded"
        >
          GitHub →
        </a>
      </div>
    </footer>
  );
}
