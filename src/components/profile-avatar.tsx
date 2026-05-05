/**
 * Deterministic gradient avatar from a username string. Pure server-safe code,
 * no dependencies — generates two HSL stops via FNV-1a hash.
 */

function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function ProfileAvatar({ username, size = 48 }: { username: string; size?: number }) {
  const h = hash(username);
  const h1 = h % 360;
  const h2 = (h1 + 60) % 360;
  const initial = (username[0] ?? "?").toUpperCase();
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, hsl(${h1} 70% 55%), hsl(${h2} 75% 45%))`,
        fontSize: size / 2,
      }}
      className="inline-flex items-center justify-center rounded-full font-semibold text-white shadow-sm"
    >
      {initial}
    </span>
  );
}
