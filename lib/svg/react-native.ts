import { localized, type Localized } from "@/lib/i18n/errors";
import { en } from "@/lib/i18n/messages/en";
import { format } from "@/lib/i18n/translate";
import { componentNameFromFile, toJsx } from "@/lib/svg/jsx";
import type { SvgNode } from "@/types/svg";

/** SVG element → react-native-svg component. Anything missing here is unsupported. */
const COMPONENTS: Record<string, string> = {
  svg: "Svg",
  g: "G",
  path: "Path",
  rect: "Rect",
  circle: "Circle",
  ellipse: "Ellipse",
  line: "Line",
  polyline: "Polyline",
  polygon: "Polygon",
  text: "Text",
  tspan: "TSpan",
  textPath: "TextPath",
  defs: "Defs",
  use: "Use",
  symbol: "Symbol",
  linearGradient: "LinearGradient",
  radialGradient: "RadialGradient",
  stop: "Stop",
  clipPath: "ClipPath",
  mask: "Mask",
  pattern: "Pattern",
  image: "Image",
  marker: "Marker",
  title: "",
  desc: "",
};

/** `warnings` are English (for code comments); `notes` are the same messages, for showing in any language. */
export type NativeResult = { code: string; warnings: string[]; notes: Localized[] };

/** The warnings found so far, once each, keyed by their English text. */
type Warnings = Map<string, Localized>;

function warn(warnings: Warnings, note: Localized) {
  warnings.set(format(en[note.key], note.params), note);
}

function convert(node: SvgNode, used: Set<string>, warnings: Warnings): SvgNode | null {
  if (node.type === "text") return node;
  const component = COMPONENTS[node.name];
  if (component === undefined) {
    warn(warnings, localized("svg.native.unsupported", { tag: node.name }));
    return null;
  }
  if (component === "") return null; // <title>/<desc>: use accessibilityLabel instead.

  const attributes: Record<string, string> = {};
  for (const [name, value] of Object.entries(node.attributes)) {
    if (name === "class") {
      warn(warnings, localized("svg.native.class"));
      continue;
    }
    if (name === "style") {
      // Inline declarations become props (react-native-svg accepts presentation attributes as props).
      for (const rule of value.split(";")) {
        const [key = "", ...rest] = rule.split(":");
        if (key.trim() && rest.join(":").trim()) attributes[key.trim()] = rest.join(":").trim();
      }
      continue;
    }
    if (name.startsWith("xmlns") || name.startsWith("data-") || name === "version" || name.startsWith("xml:")) continue;
    attributes[name === "xlink:href" ? "href" : name] = value;
  }

  used.add(component);
  return {
    ...node,
    name: component,
    attributes,
    children: node.children
      .map((child) => convert(child, used, warnings))
      .filter((child): child is SvgNode => child !== null),
  };
}

export function reactNativeComponent(root: SvgNode, fileName: string): NativeResult {
  const used = new Set<string>();
  const warnings: Warnings = new Map();
  const hasStyleSheet = root.children.some((child) => child.name === "style");
  if (hasStyleSheet) warn(warnings, localized("svg.native.style"));

  const withoutStyles = { ...root, children: root.children.filter((child) => child.name !== "style") };
  const tree = convert(withoutStyles, used, warnings);
  if (!tree) return { code: "", warnings: [...warnings.keys()], notes: [...warnings.values()] };

  const width = root.attributes.width ?? "24";
  const height = root.attributes.height ?? "24";
  tree.attributes.width = width;
  tree.attributes.height = height;

  const name = componentNameFromFile(fileName);
  const named = [...used].filter((component) => component !== "Svg").sort();
  const imports = named.length
    ? `import Svg, { ${named.join(", ")} } from "react-native-svg";`
    : `import Svg from "react-native-svg";`;
  // react-native-svg types gradient children as an array, so they're emitted as one.
  const markup = toJsx(tree, { rootSpread: "{...props}", arrayChildren: new Set(["LinearGradient", "RadialGradient"]) })
    .split("\n")
    .map((line) => `    ${line}`)
    .join("\n")
    .trimStart();

  const code = `import type { SvgProps } from "react-native-svg";
${imports}

export function ${name}(props: SvgProps) {
  return (
    ${markup}
  );
}
`;
  return { code, warnings: [...warnings.keys()], notes: [...warnings.values()] };
}
