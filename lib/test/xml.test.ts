import { expect, test } from "vitest";

import { rootSize, xmlError } from "@/lib/test/xml";

test.each([
  '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1"/></svg>',
  '<?xml version="1.0"?><!-- logo --><svg><style><![CDATA[a > b { fill: red }]]></style><text>A &amp; B &#169;</text></svg>',
  "<svg><g a='1' b=\"2\"></g></svg>",
])("accepts well-formed XML %#", (source) => {
  expect(xmlError(source)).toBeNull();
});

test.each([
  ["<svg><g></svg>", "closes"],
  ["<svg>", "never closed"],
  ["<svg/><svg/>", "more than one root"],
  ['<svg><rect a="1" a="2"/></svg>', "duplicate attribute"],
  ["<svg><rect a=1/></svg>", "unquoted"],
  ['<svg><rect a="1"b="2"/></svg>', "missing space"],
  ["<svg><text>A & B</text></svg>", "bare"],
  ['<svg><rect title="a < b"/></svg>', "raw"],
  ["<svg><style>a < b</style></svg>", "invalid tag"],
  ["hello", "text outside"],
])("rejects %s", (source, problem) => {
  expect(xmlError(source)).toContain(problem);
});

test("reads the root size", () => {
  expect(rootSize('<svg width="1600" height="900" viewBox="0 0 1600 900">')).toEqual({
    tag: "svg",
    width: 1600,
    height: 900,
    viewBox: [0, 0, 1600, 900],
  });
});
