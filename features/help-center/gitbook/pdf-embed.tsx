// Adapted from GitBook's PDF viewing presentation.
export function HelpPdfEmbed({ src, title }: { src: string; title: string }) {
  const valid = src.startsWith("/") || src.startsWith("https://");
  if (!valid) {
    return <div role="alert" className="my-5 rounded-xl border border-destructive/40 p-4 text-sm">这个 PDF 地址不能使用。</div>;
  }

  return (
    <div className="my-6 overflow-hidden rounded-2xl border">
      <object data={src} type="application/pdf" title={title} className="h-[32rem] w-full">
        <p className="p-4">浏览器无法直接显示这个 PDF。<a href={src} className="underline">下载 PDF</a></p>
      </object>
    </div>
  );
}
