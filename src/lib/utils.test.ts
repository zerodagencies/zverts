import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
    describe("basic joining", () => {
        it("returns empty string with no arguments", () => {
            expect(cn()).toBe("");
        });

        it("returns a single class name unchanged", () => {
            expect(cn("flex")).toBe("flex");
        });

        it("joins multiple plain strings with a space", () => {
            expect(cn("flex", "items-center", "gap-2")).toBe("flex items-center gap-2");
        });
    });

    describe("falsy filtering", () => {
        it("ignores false", () => expect(cn("foo", false)).toBe("foo"));
        it("ignores null", () => expect(cn("foo", null)).toBe("foo"));
        it("ignores undefined", () => expect(cn("foo", undefined)).toBe("foo"));
        it("ignores 0", () => expect(cn("foo", 0)).toBe("foo"));
        it("ignores empty string", () => expect(cn("foo", "")).toBe("foo"));

        it("keeps all truthy values when mixed with falsy", () => {
            expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
        });
    });

    describe("object syntax", () => {
        it("includes class when value is true", () => {
            expect(cn({ "font-bold": true })).toBe("font-bold");
        });

        it("excludes class when value is false", () => {
            expect(cn({ italic: false })).toBe("");
        });

        it("handles mixed true/false in one object", () => {
            expect(cn({ "font-bold": true, italic: false, underline: true })).toBe(
                "font-bold underline",
            );
        });
    });

    describe("conditional expressions", () => {
        it("includes conditional class when truthy", () => {
            const isPrimary = true;
            expect(cn("btn", isPrimary && "btn-primary")).toBe("btn btn-primary");
        });

        it("excludes conditional class when falsy", () => {
            const isPrimary = false;
            expect(cn("btn", isPrimary && "btn-primary")).toBe("btn");
        });
    });

    describe("tailwind-merge — conflicting utility resolution", () => {
        it("last text-color wins", () => {
            expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
        });

        it("last padding wins", () => {
            expect(cn("p-4", "p-2")).toBe("p-2");
        });

        it("specific padding overrides shorthand", () => {
            expect(cn("p-4", "px-2")).toBe("p-4 px-2");
        });

        it("shorthand overrides specific axes — p-4 beats px-2 py-1", () => {
            expect(cn("px-2 py-1", "p-4")).toBe("p-4");
        });

        it("last font-weight wins", () => {
            expect(cn("font-bold", "font-medium")).toBe("font-medium");
        });

        it("last bg-color wins", () => {
            expect(cn("bg-red-500", "bg-green-500")).toBe("bg-green-500");
        });
    });

    describe("non-conflicting classes are preserved", () => {
        it("keeps all non-conflicting classes from both args", () => {
            const result = cn("flex items-center", "text-sm font-bold");
            expect(result).toContain("flex");
            expect(result).toContain("items-center");
            expect(result).toContain("text-sm");
            expect(result).toContain("font-bold");
        });
    });
});
