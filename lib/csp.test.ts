import { afterEach, describe, expect, test, vi } from "vitest";

import { buildContentSecurityPolicy, connectSources, defaultConnectSources } from "@/lib/csp";

describe("the Content-Security-Policy", () => {
  test("by default connect-src allows https and localhost, as the AI provider may be anywhere", () => {
    expect(buildContentSecurityPolicy()).toContain(`connect-src 'self' ${defaultConnectSources};`);
    expect(buildContentSecurityPolicy("")).toContain(`connect-src 'self' ${defaultConnectSources};`);
  });

  test("a value replaces the default after self", () => {
    const policy = buildContentSecurityPolicy("https://api.iconify.design https://api.simplesvg.com");
    expect(policy).toContain("connect-src 'self' https://api.iconify.design https://api.simplesvg.com;");
    expect(policy).not.toContain("https: ");
  });

  test("a value with a quote, a semicolon or a bare wildcard is refused as a whole, and the default stays", () => {
    for (const value of [
      "https://a.test; script-src *",
      "'unsafe-eval' https://a.test",
      "'none'",
      "*",
      "https://a.test;object-src",
    ]) {
      expect(connectSources(value), value).toBe(defaultConnectSources);
    }
  });

  test("the rest of the policy does not change with the value", () => {
    const rest = (policy: string) => policy.split("; ").filter((part) => !part.startsWith("connect-src"));
    expect(rest(buildContentSecurityPolicy("https://a.test"))).toEqual(rest(buildContentSecurityPolicy()));
  });

  describe("next.config.ts", () => {
    afterEach(() => vi.unstubAllEnvs());

    const headerOf = async () => {
      const config = (await import("../next.config")).default;
      const rules = (await config.headers?.()) ?? [];
      return rules.flatMap((rule) => rule.headers).find((header) => header.key === "Content-Security-Policy")?.value;
    };

    test("sends the policy in production, built from DESIGNHUB_CSP_CONNECT, and not in development", async () => {
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("DESIGNHUB_CSP_CONNECT", "https://api.iconify.design");
      expect(await headerOf()).toContain("connect-src 'self' https://api.iconify.design;");
      vi.stubEnv("DESIGNHUB_CSP_CONNECT", "");
      expect(await headerOf()).toContain(`connect-src 'self' ${defaultConnectSources};`);
      vi.stubEnv("NODE_ENV", "development");
      expect(await headerOf()).toBeUndefined();
    });
  });
});
