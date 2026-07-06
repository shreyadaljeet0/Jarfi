import { describe, expect, it } from "vitest";
import { needsDate, needsAmount, validateJarInputs } from "./jar-form";

describe("needsDate", () => {
  it("is true for every type except GoalOnly", () => {
    expect(needsDate("DateOnly")).toBe(true);
    expect(needsDate("GoalOnly")).toBe(false);
    expect(needsDate("EitherOne")).toBe(true);
    expect(needsDate("BothRequired")).toBe(true);
  });
});

describe("needsAmount", () => {
  it("is true for every type except DateOnly", () => {
    expect(needsAmount("DateOnly")).toBe(false);
    expect(needsAmount("GoalOnly")).toBe(true);
    expect(needsAmount("EitherOne")).toBe(true);
    expect(needsAmount("BothRequired")).toBe(true);
  });
});

describe("validateJarInputs", () => {
  it("requires an asset address", () => {
    expect(
      validateJarInputs({ unlockType: "DateOnly", asset: "", targetDate: "2030-01-01", targetAmount: "" }),
    ).toMatch(/token contract address/i);
  });

  it("requires a target date for DateOnly", () => {
    expect(
      validateJarInputs({ unlockType: "DateOnly", asset: "C123", targetDate: "", targetAmount: "" }),
    ).toMatch(/target date/i);
  });

  it("does not require a target date for GoalOnly", () => {
    expect(
      validateJarInputs({ unlockType: "GoalOnly", asset: "C123", targetDate: "", targetAmount: "100" }),
    ).toBeNull();
  });

  it("requires a positive target amount for GoalOnly", () => {
    expect(
      validateJarInputs({ unlockType: "GoalOnly", asset: "C123", targetDate: "", targetAmount: "0" }),
    ).toMatch(/greater than 0/i);
  });

  it("requires both date and amount for BothRequired", () => {
    expect(
      validateJarInputs({
        unlockType: "BothRequired",
        asset: "C123",
        targetDate: "2030-01-01",
        targetAmount: "",
      }),
    ).toMatch(/greater than 0/i);
  });

  it("passes when all required fields are present", () => {
    expect(
      validateJarInputs({
        unlockType: "EitherOne",
        asset: "C123",
        targetDate: "2030-01-01",
        targetAmount: "50",
      }),
    ).toBeNull();
  });
});
