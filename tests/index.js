const assert = require("assert");
const Model = require("json-verifier");

describe("Package", function () {
    const m = new Model({a: String});
    it("should success", function () {
        assert.ok(m.confirmMatches({a: "Hello there"}));
    });
});