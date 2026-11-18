import { test } from "node:test";
import assert from "node:assert/strict";
import { validate, handleSubmit, handleList, handleWishes } from "../lib/rsvp.js";

test("validate accepts an attending response and tidies the text", () => {
  assert.deepEqual(validate({ name: "  Siti   Aminah ", attending: true, pax: 3, message: " Selamat  pengantin baru " }), {
    name: "Siti Aminah",
    attending: true,
    pax: 3,
    message: "Selamat pengantin baru",
  });
});

test("not attending stores pax 0 whatever was sent", () => {
  assert.deepEqual(validate({ name: "Ali", attending: false, pax: 5 }), { name: "Ali", attending: false, pax: 0, message: "" });
});

test("validate rejects bad input", () => {
  assert.equal(validate({ name: "A", attending: true, pax: 1 }).error, "name");
  assert.equal(validate({ name: "x".repeat(81), attending: true, pax: 1 }).error, "name");
  assert.equal(validate({ name: "Ali", pax: 1 }).error, "attending");
  assert.equal(validate({ name: "Ali", attending: "yes", pax: 1 }).error, "attending");
  assert.equal(validate({ name: "Ali", attending: true, pax: 0 }).error, "pax");
  assert.equal(validate({ name: "Ali", attending: true, pax: 11 }).error, "pax");
  assert.equal(validate({ name: "Ali", attending: true, pax: 1.5 }).error, "pax");
  assert.equal(validate({ name: "Ali", attending: true, pax: 1, message: "m".repeat(301) }).error, "message");
  assert.equal(validate(null).error, "invalid");
});

test("honeypot is treated as spam", () => {
  assert.equal(validate({ name: "Bot", attending: true, pax: 1, website: "http://x" }).spam, true);
});

test("submit: wrong method and bad input", async () => {
  assert.equal((await handleSubmit("GET", {})).status, 405);
  assert.equal((await handleSubmit("POST", { name: "", attending: true, pax: 1 })).status, 400);
});

test("wishes: only GET", async () => {
  assert.equal((await handleWishes("POST")).status, 405);
});

test("list: needs a configured and correct passcode", async () => {
  delete process.env.ADMIN_PASSCODE;
  assert.equal((await handleList("GET", "x")).status, 503);
  process.env.ADMIN_PASSCODE = "secret";
  assert.equal((await handleList("GET", "nope")).status, 401);
  assert.equal((await handleList("GET", undefined)).status, 401);
});
