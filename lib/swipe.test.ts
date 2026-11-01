import { describe, expect, test } from "vitest";

import { paneAfterSwipe, swipeDirection } from "@/lib/swipe";

const at = (x: number, y = 0) => ({ x, y });

describe("swipeDirection", () => {
  test("a long, mostly sideways move is a swipe: left goes on, right goes back", () => {
    expect(swipeDirection(at(300), at(100, 20))).toBe(1);
    expect(swipeDirection(at(100), at(300, -20))).toBe(-1);
  });

  test("a short move, or one that is as much up and down as sideways, is not", () => {
    expect(swipeDirection(at(100), at(150))).toBe(0);
    expect(swipeDirection(at(100, 0), at(200, 90))).toBe(0);
    expect(swipeDirection(at(100, 0), at(200, 0))).toBe(-1);
  });
});

describe("paneAfterSwipe", () => {
  const panes = ["controls", "preview", "output"] as const;

  test("moves one pane and stops at the ends", () => {
    expect(paneAfterSwipe(panes, "controls", at(300), at(100))).toBe("preview");
    expect(paneAfterSwipe(panes, "preview", at(100), at(300))).toBe("controls");
    expect(paneAfterSwipe(panes, "output", at(300), at(100))).toBe("output");
    expect(paneAfterSwipe(panes, "controls", at(100), at(300))).toBe("controls");
  });

  test("a studio with two panes only goes between them", () => {
    expect(paneAfterSwipe(["controls", "preview"] as const, "preview", at(300), at(100))).toBe("preview");
  });

  test("a move that is not a swipe changes nothing", () => {
    expect(paneAfterSwipe(panes, "preview", at(100), at(120))).toBe("preview");
  });
});
