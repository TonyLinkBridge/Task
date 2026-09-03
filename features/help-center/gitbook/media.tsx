import Image from "next/image";

const videoHosts = new Set([
  "www.youtube.com",
  "www.youtube-nocookie.com",
  "player.vimeo.com",
  "www.loom.com",
]);

function safeVideoUrl(src: string) {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && videoHosts.has(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

// Adapted from GitBook's Images and Embed components.
export function HelpImage({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="my-6">
      <div className="overflow-hidden rounded-2xl border bg-muted/30">
        <Image src={src} alt={alt} width={1200} height={675} className="h-auto w-full object-contain" />
      </div>
      {caption ? <figcaption className="mt-2 text-center text-sm text-muted-foreground">{caption}</figcaption> : null}
    </figure>
  );
}

export function HelpVideo({ src, title }: { src: string; title: string }) {
  const safeSrc = safeVideoUrl(src);
  if (!safeSrc) {
    return <div role="alert" className="my-5 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">这个影片地址不能使用。</div>;
  }

  return (
    <div className="my-6 aspect-video overflow-hidden rounded-2xl border bg-black">
      <iframe
        src={safeSrc}
        title={title}
        className="size-full"
        loading="lazy"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
