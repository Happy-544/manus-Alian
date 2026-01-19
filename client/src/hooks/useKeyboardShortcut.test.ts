import { describe, it, expect, vi } from "vitest";
import { useKeyboardShortcut } from "./useKeyboardShortcut";

// Skip all tests in Node environment (no DOM)
describe.skipIf(typeof window === "undefined")("useKeyboardShortcut", () => {
  it("should register keyboard listener on mount", () => {
    const callback = vi.fn();
    const addEventListenerSpy = vi.spyOn(window, "addEventListener");

    useKeyboardShortcut({
      key: "?",
      callback,
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );

    addEventListenerSpy.mockRestore();
  });

  it("should unregister keyboard listener on unmount", () => {
    const callback = vi.fn();
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const cleanup = useKeyboardShortcut({
      key: "?",
      callback,
    });

    // Simulate cleanup
    if (typeof cleanup === "function") {
      cleanup();
    }

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "keydown",
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  it("should trigger callback when correct key is pressed", () => {
    const callback = vi.fn();

    useKeyboardShortcut({
      key: "?",
      callback,
    });

    const event = new KeyboardEvent("keydown", {
      key: "?",
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).toHaveBeenCalled();
  });

  it("should not trigger callback when wrong key is pressed", () => {
    const callback = vi.fn();

    useKeyboardShortcut({
      key: "?",
      callback,
    });

    const event = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
  });

  it("should handle modifier keys correctly", () => {
    const callback = vi.fn();

    useKeyboardShortcut({
      key: "s",
      ctrlKey: true,
      callback,
    });

    // Should not trigger without Ctrl
    const eventWithoutCtrl = new KeyboardEvent("keydown", {
      key: "s",
      bubbles: true,
    });
    window.dispatchEvent(eventWithoutCtrl);
    expect(callback).not.toHaveBeenCalled();

    // Should trigger with Ctrl
    const eventWithCtrl = new KeyboardEvent("keydown", {
      key: "s",
      ctrlKey: true,
      bubbles: true,
    });
    window.dispatchEvent(eventWithCtrl);
    expect(callback).toHaveBeenCalled();
  });

  it("should not trigger in input fields", () => {
    const callback = vi.fn();

    useKeyboardShortcut({
      key: "?",
      callback,
    });

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent("keydown", {
      key: "?",
      bubbles: true,
    });
    Object.defineProperty(event, "target", {
      value: input,
      enumerable: true,
    });

    window.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("should respect enabled flag", () => {
    const callback = vi.fn();

    // Start disabled
    useKeyboardShortcut({
      key: "?",
      callback,
      enabled: false,
    });

    const event = new KeyboardEvent("keydown", {
      key: "?",
      bubbles: true,
    });

    window.dispatchEvent(event);
    expect(callback).not.toHaveBeenCalled();
  });

  it("should prevent default when preventDefault is true", () => {
    const callback = vi.fn();

    useKeyboardShortcut({
      key: "?",
      callback,
      preventDefault: true,
    });

    const event = new KeyboardEvent("keydown", {
      key: "?",
      bubbles: true,
    });
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    window.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("should handle case-insensitive key matching", () => {
    const callback = vi.fn();

    useKeyboardShortcut({
      key: "A",
      callback,
    });

    const event = new KeyboardEvent("keydown", {
      key: "a",
      bubbles: true,
    });

    window.dispatchEvent(event);

    expect(callback).toHaveBeenCalled();
  });
});
