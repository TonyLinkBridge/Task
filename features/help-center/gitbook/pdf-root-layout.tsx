export function HelpPdfRootLayout({
  title,
  category,
  updatedAt,
  children,
}: {
  title: string;
  category: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className="help-pdf-document mx-auto w-full max-w-4xl bg-background px-6 py-8 text-foreground sm:px-10 sm:py-12"
      data-testid="pdf-print-document"
    >
      <header className="mb-10 border-b pb-6">
        <p className="text-sm font-medium text-muted-foreground">{category}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">最后更新：{updatedAt}</p>
      </header>
      {children}
    </article>
  );
}
