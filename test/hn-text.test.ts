import { parseHnText } from "@/lib/hn/hn-text";
import { describe, expect, it } from "vitest";

describe("parseHnText", () => {
  it("splits on blank lines into paragraphs", () => {
    const ast = parseHnText("hello\n\nworld");
    expect(ast).toHaveLength(2);
    expect(ast[0].type).toBe("paragraph");
  });

  it("renders italic", () => {
    const ast = parseHnText("hi *there* friend");
    if (ast[0].type !== "paragraph") throw new Error("expected paragraph");
    const types = ast[0].children.map((c) => c.type);
    expect(types).toContain("italic");
  });

  it("treats two-space-indented blocks as code", () => {
    const ast = parseHnText("  function foo() {}\n  return 1;");
    expect(ast[0].type).toBe("code");
    if (ast[0].type !== "code") return;
    expect(ast[0].text).toBe("function foo() {}\nreturn 1;");
  });

  it("autolinks urls", () => {
    const ast = parseHnText("see https://example.com for more");
    if (ast[0].type !== "paragraph") throw new Error("expected paragraph");
    const link = ast[0].children.find((c) => c.type === "link");
    expect(link).toBeTruthy();
    if (link?.type === "link") expect(link.href).toBe("https://example.com");
  });
});
