import test from "node:test";
import assert from "node:assert/strict";
import { isAudienceMatch } from "./academic-chain";

test("isAudienceMatch matches ALL audience for everyone", () => {
  assert.equal(isAudienceMatch("ALL", null, null), true);
  assert.equal(isAudienceMatch("ALL", "univ-1", { id: "u1" }), true);
});

test("isAudienceMatch checks UNIVERSITY audience correctly", () => {
  const user = { id: "u1", universityId: "univ-1" };
  assert.equal(isAudienceMatch("UNIVERSITY", "univ-1, univ-2", user), true);
  assert.equal(isAudienceMatch("UNIVERSITY", "univ-3", user), false);
  assert.equal(isAudienceMatch("UNIVERSITY", "univ-1", null), false);
});

test("isAudienceMatch checks MAJOR and YEAR audience correctly", () => {
  const user = { id: "u1", majorId: "maj-1", academicYearId: "yr-2" };
  assert.equal(isAudienceMatch("MAJOR", "maj-1", user), true);
  assert.equal(isAudienceMatch("MAJOR", "maj-99", user), false);
  assert.equal(isAudienceMatch("YEAR", "yr-2", user), true);
  assert.equal(isAudienceMatch("YEAR", "yr-1", user), false);
});
