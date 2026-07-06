import { describe, expect, it } from "vitest";
import { formatUnits, toStroops, formatCountdown } from "./format";

describe("formatUnits", () => {
  it("formats whole XLM amounts without a decimal point", () => {
    expect(formatUnits(50_000_000n)).toBe("5");
  });

  it("formats fractional amounts and trims trailing zeros", () => {
    expect(formatUnits(12_500_0000n)).toBe("12.5");
  });

  it("formats zero", () => {
    expect(formatUnits(0n)).toBe("0");
  });
});

describe("toStroops", () => {
  it("converts whole XLM strings to stroops", () => {
    expect(toStroops("5")).toBe(50_000_000n);
  });

  it("converts fractional XLM strings to stroops", () => {
    expect(toStroops("12.5")).toBe(125_000_000n);
  });

  it("round-trips through formatUnits", () => {
    const stroops = 123_456_789n;
    expect(toStroops(formatUnits(stroops))).toBe(stroops);
  });
});

describe("formatCountdown", () => {
  it("reports unlocked once the target has passed", () => {
    expect(formatCountdown(100n, 200)).toBe("unlocked");
  });

  it("formats days and hours remaining", () => {
    expect(formatCountdown(200_000n, 0)).toBe("2d 7h");
  });

  it("formats seconds remaining when under a minute", () => {
    expect(formatCountdown(30n, 0)).toBe("30s");
  });
});
