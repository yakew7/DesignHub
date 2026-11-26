import { createHash } from "node:crypto";

import { describe, expect, test } from "vitest";

import { inlineScripts, pagePolicy, scriptHash, withPolicy } from "../../scripts/csp-hashes.mjs";

const page = `<!DOCTYPE html><html><head><meta charSet="utf-8"/><script src="/a.js" async=""></script><script>self.__next_f=[]</script><script type="application/json">{"a":1}</script></head><body><script>self.__next_f.push([1,"x"])</script><script></script></body></html>`;

describe("csp-hashes", () => {
  test("finds the inline scripts, not the ones with a src, the data blocks or the empty ones", () => {
    expect(inlineScripts(page)).toEqual(["self.__next_f=[]", 'self.__next_f.push([1,"x"])']);
  });

  test("a script's hash is the sha256 of its exact text, in base64", () => {
    const text = 'self.__next_f.push([1,"x"])';
    expect(scriptHash(text)).toBe(`'sha256-${createHash("sha256").update(text).digest("base64")}'`);
  });

  test("a page's policy allows its own scripts and each inline one once", () => {
    const policy = pagePolicy(["a", "a", "b"]);
    expect(policy.startsWith("script-src 'self' 'sha256-")).toBe(true);
    expect(policy.match(/sha256-/g)?.length).toBe(2);
    expect(policy).not.toContain("unsafe-inline");
  });

  test("the policy goes first in the head, and adding it again replaces it", () => {
    const once = withPolicy(page);
    expect(once).toContain("<head><meta http-equiv=\"Content-Security-Policy\" content=\"script-src 'self' 'sha256-");
    expect(withPolicy(once)).toBe(once);
    expect(once.match(/http-equiv="Content-Security-Policy"/g)?.length).toBe(1);
  });

  test("a page with no head is left alone", () => {
    expect(withPolicy("<p>fragment</p>")).toBe("<p>fragment</p>");
  });
});
