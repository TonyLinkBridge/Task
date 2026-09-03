import Image from "next/image";

// Adapted from GitBook's PageCover component.
export function HelpPageCover({ src, title }: { src: string; title: string }) {
  return (
    <div className="relative mb-7 h-44 overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-50 via-card to-pink-50 dark:from-blue-950/40 dark:via-card dark:to-pink-950/30 sm:h-56">
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        width={384}
        height={384}
        className="absolute bottom-[-5rem] right-6 size-64 object-contain opacity-90 sm:right-12"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 to-transparent p-6 pt-20">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
      </div>
    </div>
  );
}
