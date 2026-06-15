import { test, expect } from "bun:test";
import {
  parseMouseEvent,
  enableMouseTracking,
  disableMouseTracking,
  type MouseEvent,
} from "../../src/input/mouse";

test("parseMouseEvent > parses left click", () => {
  const result = parseMouseEvent("\x1b[<0;25;10M");
  expect(result).toEqual({
    type: "click",
    button: "left",
    col: 25,
    row: 10,
  } satisfies MouseEvent);
});

test("parseMouseEvent > parses middle click", () => {
  const result = parseMouseEvent("\x1b[<1;25;10M");
  expect(result).toEqual({
    type: "click",
    button: "middle",
    col: 25,
    row: 10,
  } satisfies MouseEvent);
});

test("parseMouseEvent > parses right click", () => {
  const result = parseMouseEvent("\x1b[<2;25;10M");
  expect(result).toEqual({
    type: "click",
    button: "right",
    col: 25,
    row: 10,
  } satisfies MouseEvent);
});

test("parseMouseEvent > parses left drag", () => {
  const result = parseMouseEvent("\x1b[<32;25;10M");
  expect(result).toEqual({
    type: "drag",
    button: "left",
    col: 25,
    row: 10,
  } satisfies MouseEvent);
});

test("parseMouseEvent > parses middle drag", () => {
  const result = parseMouseEvent("\x1b[<33;25;10M");
  expect(result).toEqual({
    type: "drag",
    button: "middle",
    col: 25,
    row: 10,
  } satisfies MouseEvent);
});

test("parseMouseEvent > parses right drag", () => {
  const result = parseMouseEvent("\x1b[<34;25;10M");
  expect(result).toEqual({
    type: "drag",
    button: "right",
    col: 25,
    row: 10,
  } satisfies MouseEvent);
});

test("parseMouseEvent > returns null for release event", () => {
  const result = parseMouseEvent("\x1b[<0;25;10m");
  expect(result).toBeNull();
});

test("parseMouseEvent > returns null for non-mouse sequence", () => {
  const result = parseMouseEvent("hello");
  expect(result).toBeNull();
});

test("parseMouseEvent > returns null for empty string", () => {
  const result = parseMouseEvent("");
  expect(result).toBeNull();
});

test("parseMouseEvent > returns null for malformed SGR sequence", () => {
  const result = parseMouseEvent("\x1b[<0;25M");
  expect(result).toBeNull();
});

test("enableMouseTracking > writes SGR mouse tracking enable sequences", () => {
  const writes: string[] = [];
  const stdout = { write: (data: string) => writes.push(data) };
  enableMouseTracking(stdout as any);
  expect(writes).toEqual(["\x1b[?1000h\x1b[?1002h\x1b[?1015h"]);
});

test("disableMouseTracking > writes SGR mouse tracking disable sequences", () => {
  const writes: string[] = [];
  const stdout = { write: (data: string) => writes.push(data) };
  disableMouseTracking(stdout as any);
  expect(writes).toEqual(["\x1b[?1000l\x1b[?1002l\x1b[?1015l"]);
});
