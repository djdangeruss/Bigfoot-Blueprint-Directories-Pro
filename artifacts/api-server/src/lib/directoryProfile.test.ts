import assert from "node:assert/strict";
import test from "node:test";
import { directoryProfile } from "./directoryProfile.js";

test("maps each production hostname to its own profile", () => {
  assert.equal(directoryProfile("https://colombianrestaurantnear.me", "").id, "colrest");
  assert.equal(directoryProfile("https://startupbusinessloans.online", "").id, "lender");
  assert.equal(directoryProfile("https://caballosenventa.co", "").id, "horse");
});

test("never assigns the restaurant profile to an unknown hostname", () => {
  assert.equal(directoryProfile("https://example.com", "").id, "generic");
});

test("explicit profiles are validated", () => {
  assert.equal(directoryProfile("https://example.com", "lender").id, "lender");
  assert.throws(() => directoryProfile("https://example.com", "restaurant-copy"), /Unsupported DIRECTORY_PROFILE/);
});

test("lender and horse metadata contain no restaurant identity", () => {
  for (const id of ["lender", "horse"] as const) {
    const profile = directoryProfile("https://example.com", id);
    const rendered = JSON.stringify(profile).toLowerCase();
    assert.doesNotMatch(rendered, /colombian restaurant|restaurant near me|colombian table/);
  }
});

