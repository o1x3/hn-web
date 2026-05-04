import { faviconUrl } from "@/lib/utils";

export function DomainFavicon({ domain, size = 14 }: { domain: string; size?: number }) {
  return (
    <img
      src={faviconUrl(domain, 32)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className="inline-block rounded-sm align-text-bottom"
      style={{ width: size, height: size }}
    />
  );
}
