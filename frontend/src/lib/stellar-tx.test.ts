import { describe, expect, it } from "vitest";
import { isValidStellarAddress } from "./stellar-tx";

describe("isValidStellarAddress", () => {
  it("accepts a well-formed testnet G-address", () => {
    expect(
      isValidStellarAddress(
        "GAAMIRGTPRHPC3TA3KWBI22AFH3N3UFPCCWG37RZBCRB7EVYNVVVCK7W",
      ),
    ).toBe(true);
  });

  it("rejects an address with an invalid checksum", () => {
    expect(
      isValidStellarAddress(
        "GAAMIRGTPRHPC3TA3KWBI22AFH3N3UFPCCWG37RZBCRB7EVYNVVVCK7X",
      ),
    ).toBe(false);
  });

  it("rejects a contract (C...) address", () => {
    expect(
      isValidStellarAddress(
        "CBR4V5L5ES2RMLHCXAGJAGI3GAEPFK4H744UJP6DIXM7FZA2CSB47ZWN",
      ),
    ).toBe(false);
  });

  it("rejects garbage input", () => {
    expect(isValidStellarAddress("not-an-address")).toBe(false);
    expect(isValidStellarAddress("")).toBe(false);
  });
});
