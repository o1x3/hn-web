import { type HnNode, parseHnText } from "@/lib/hn/hn-text";
import { cn } from "@/lib/utils";

/** Renders user-entered HN-flavored text using the same parser HN uses. */
export function HnFlavoredText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const nodes = parseHnText(text);
  return (
    <div className={cn("hn-text", className)}>
      {nodes.map((n, i) => (
        <RenderNode key={i} node={n} />
      ))}
    </div>
  );
}

function RenderNode({ node }: { node: HnNode }) {
  if (node.type === "code") {
    return (
      <pre>
        <code>{node.text}</code>
      </pre>
    );
  }
  return (
    <p>
      {node.children.map((c, i) => {
        if (c.type === "text") return <span key={i}>{c.value}</span>;
        if (c.type === "italic") return <i key={i}>{c.value}</i>;
        return (
          <a key={i} href={c.href} target="_blank" rel="noopener noreferrer nofollow ugc">
            {c.value}
          </a>
        );
      })}
    </p>
  );
}
