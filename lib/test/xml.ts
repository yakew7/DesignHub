/**
 * A small, dependency-free XML well-formedness check for tests (Vitest runs in node, so
 * there is no DOMParser). Returns null when `source` is well formed, or the first problem.
 * It checks what breaks real parsers: unbalanced or mismatched tags, a single root element,
 * quoted and unique attributes, a raw `<` in text or attribute values, and `&` that doesn't
 * start a valid entity.
 */
export function xmlError(source: string): string | null {
  const name = /^[A-Za-z_:][\w.:-]*/;
  const entity = /^&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);/;
  const stack: string[] = [];
  let roots = 0;
  let index = 0;

  const at = (position: number) => {
    const line = source.slice(0, position).split("\n").length;
    return `line ${line}, near "${source.slice(position, position + 40)}"`;
  };

  /** Checks text or an attribute value for raw `<` and bare `&`. */
  const checkText = (text: string, offset: number): string | null => {
    for (let i = 0; i < text.length; i += 1) {
      if (text[i] === "<") return `raw "<" at ${at(offset + i)}`;
      if (text[i] === "&" && !entity.test(text.slice(i))) return `bare "&" at ${at(offset + i)}`;
    }
    return null;
  };

  while (index < source.length) {
    const open = source.indexOf("<", index);
    const textEnd = open === -1 ? source.length : open;
    const text = source.slice(index, textEnd);
    if (stack.length === 0 && text.trim()) return `text outside the root element at ${at(index)}`;
    const textProblem = checkText(text, index);
    if (textProblem) return textProblem;
    if (open === -1) break;

    const rest = source.slice(open);
    const special = [
      ["<!--", "-->"],
      ["<![CDATA[", "]]>"],
      ["<?", "?>"],
      ["<!DOCTYPE", ">"],
    ].find(([start]) => rest.startsWith(start as string));
    if (special) {
      const [start, end] = special as [string, string];
      if (start === "<![CDATA[" && stack.length === 0) return `CDATA outside the root element at ${at(open)}`;
      const close = source.indexOf(end, open + start.length);
      if (close === -1) return `unterminated ${start} at ${at(open)}`;
      if (start === "<!--" && source.slice(open + 4, close).includes("--"))
        return `"--" inside a comment at ${at(open)}`;
      index = close + end.length;
      continue;
    }

    if (rest.startsWith("</")) {
      const tag = rest.slice(2).match(name)?.[0];
      if (!tag) return `invalid closing tag at ${at(open)}`;
      const close = source.indexOf(">", open);
      if (close === -1 || source.slice(open + 2 + tag.length, close).trim())
        return `malformed closing tag at ${at(open)}`;
      const expected = stack.pop();
      if (expected !== tag) return `</${tag}> closes <${expected ?? "nothing"}> at ${at(open)}`;
      index = close + 1;
      continue;
    }

    const tag = rest.slice(1).match(name)?.[0];
    if (!tag) return `invalid tag name at ${at(open)}`;
    if (stack.length === 0 && roots > 0) return `more than one root element at ${at(open)}`;
    let cursor = open + 1 + tag.length;
    const seen = new Set<string>();
    let selfClosing = false;
    for (;;) {
      const space = source.slice(cursor).match(/^\s*/)?.[0].length ?? 0;
      cursor += space;
      if (source.startsWith("/>", cursor)) {
        selfClosing = true;
        cursor += 2;
        break;
      }
      if (source[cursor] === ">") {
        cursor += 1;
        break;
      }
      if (cursor >= source.length) return `unterminated <${tag}> at ${at(open)}`;
      if (space === 0) return `missing space before an attribute in <${tag}> at ${at(cursor)}`;
      const attribute = source.slice(cursor).match(name)?.[0];
      if (!attribute) return `invalid attribute in <${tag}> at ${at(cursor)}`;
      if (seen.has(attribute)) return `duplicate attribute "${attribute}" in <${tag}> at ${at(cursor)}`;
      seen.add(attribute);
      cursor += attribute.length;
      const equals = source.slice(cursor).match(/^\s*=\s*/)?.[0];
      if (!equals) return `attribute "${attribute}" has no value in <${tag}> at ${at(cursor)}`;
      cursor += equals.length;
      const quote = source[cursor];
      if (quote !== '"' && quote !== "'") return `unquoted attribute "${attribute}" in <${tag}> at ${at(cursor)}`;
      const end = source.indexOf(quote, cursor + 1);
      if (end === -1) return `unterminated attribute "${attribute}" in <${tag}> at ${at(cursor)}`;
      const valueProblem = checkText(source.slice(cursor + 1, end), cursor + 1);
      if (valueProblem) return valueProblem;
      cursor = end + 1;
    }
    if (stack.length === 0) roots += 1;
    if (!selfClosing) stack.push(tag);
    index = cursor;
  }

  if (stack.length > 0) return `<${stack[stack.length - 1]}> is never closed`;
  if (roots === 0) return "no root element";
  return null;
}

/** Reads the root element's tag, width, height and viewBox. */
export function rootSize(svg: string): { tag: string; width: number; height: number; viewBox: number[] } {
  const start = svg.match(/<([A-Za-z][\w:-]*)\b[^>]*>/);
  const tag = start?.[0] ?? "";
  const attr = (attribute: string) => tag.match(new RegExp(`\\s${attribute}="([^"]*)"`))?.[1] ?? "";
  return {
    tag: start?.[1] ?? "",
    width: Number(attr("width")),
    height: Number(attr("height")),
    viewBox: attr("viewBox")
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number),
  };
}
