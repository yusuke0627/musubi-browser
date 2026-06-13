import { test, expect } from "bun:test";
import {
  parseKeyEvent,
  setStdinRawMode,
  readInput,
  type KeyEvent,
} from "../../src/input/keyboard";

function mockReader(chunks: string[]): ReadableStreamDefaultReader<Uint8Array> {
  let i = 0;
  return {
    read: async () => {
      if (i >= chunks.length) {
        return { done: true, value: undefined };
      }
      const value = new TextEncoder().encode(chunks[i++]);
      return { done: false, value };
    },
    releaseLock: () => {},
  } as unknown as ReadableStreamDefaultReader<Uint8Array>;
}

test("parseKeyEvent > parses Tab", () => {
  const result = parseKeyEvent("\t");
  expect(result).toEqual({ type: "tab" } satisfies KeyEvent);
});

test("parseKeyEvent > parses Enter (\\r)", () => {
  const result = parseKeyEvent("\r");
  expect(result).toEqual({ type: "enter" } satisfies KeyEvent);
});

test("parseKeyEvent > parses Enter (\\r\\n)", () => {
  const result = parseKeyEvent("\r\n");
  expect(result).toEqual({ type: "enter" } satisfies KeyEvent);
});

test("parseKeyEvent > parses Escape", () => {
  const result = parseKeyEvent("\x1b");
  expect(result).toEqual({ type: "escape" } satisfies KeyEvent);
});

test("parseKeyEvent > returns other for plain character", () => {
  const result = parseKeyEvent("a");
  expect(result).toEqual({ type: "other" } satisfies KeyEvent);
});

test("parseKeyEvent > returns other for multi-character text", () => {
  const result = parseKeyEvent("abc");
  expect(result).toEqual({ type: "other" } satisfies KeyEvent);
});

test("setStdinRawMode > calls setRawMode with given value", () => {
  const calls: boolean[] = [];
  const stdin = {
    setRawMode: (value: boolean) => calls.push(value),
    isTTY: true,
  };
  setStdinRawMode(true, stdin as any);
  expect(calls).toEqual([true]);
});

test("setStdinRawMode > does nothing when stream lacks setRawMode", () => {
  const stdin = {};
  expect(() => setStdinRawMode(false, stdin as any)).not.toThrow();
});

test("readInput > returns mouse event from mock reader", async () => {
  const reader = mockReader(["\x1b[<0;25;10M"]);
  const event = await readInput(reader);
  expect(event).toEqual({
    type: "click",
    button: "left",
    col: 25,
    row: 10,
  });
});

test("readInput > returns key event from mock reader", async () => {
  const reader = mockReader(["\t"]);
  const event = await readInput(reader);
  expect(event).toEqual({ type: "tab" });
});

test("readInput > accumulates partial mouse sequence across chunks", async () => {
  const reader = mockReader(["\x1b[<0;25;", "10M"]);
  const event = await readInput(reader);
  expect(event).toEqual({
    type: "click",
    button: "left",
    col: 25,
    row: 10,
  });
});

test("readInput > returns escape for lone escape byte", async () => {
  const reader = mockReader(["\x1b"]);
  const event = await readInput(reader);
  expect(event).toEqual({ type: "escape" });
});
