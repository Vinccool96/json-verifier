const assert = require("assert");
const Model = require("../../src/core/Model");
const {NullObjectError} = require("../../src/errors");
const {Union} = require("../../src/core/types");

describe("Model", function () {
    describe("#constructor(obj)", function () {
        describe("Not a non-null object", function () {
            it("should throw a TypeError if not an object", function () {
                assert.throws(() => new Model(undefined), TypeError);
            });
            it("should throw a NullObjectError if null", function () {
                assert.throws(() => new Model(null), NullObjectError);
            });
        });
    });
    describe("#confirmMatches(object)", function () {
        describe("Simple definition", function () {
            it("should return true", function () {
                const model = new Model({
                    a: String,
                    b: Boolean,
                });
                assert.ok(model.confirmMatches({a: "", b: false}));
            });
        });
        describe("Using description", function () {
            it("should return true", function () {
                const model = new Model({
                    a: {type: String},
                    b: Boolean,
                });
                assert.ok(model.confirmMatches({a: "", b: false}));
            });
        });
        describe("Problems with params", function () {
            it("should return false", function () {
                const model = new Model({
                    a: {type: String},
                    b: Boolean,
                });
                assert.ok(!model.confirmMatches({a: "", b: false, c: "bar"}));
                assert.ok(!model.confirmMatches({a: ""}));
            });
        });
        describe("required:false not there", function () {
            it("should return true", function () {
                const model = new Model({
                    a: {type: String},
                    b: {
                        type: Boolean,
                        required: false,
                    },
                });
                assert.ok(model.confirmMatches({a: ""}));
            });
        });
        describe("Uses model as type", function () {
            it("should return true", function () {
                const bModel = new Model({
                    c: Number,
                    d: BigInt,
                });
                const model = new Model({
                    a: {type: String},
                    b: bModel,
                });
                assert.ok(model.confirmMatches({
                    a: "",
                    b: {
                        c: 1,
                        d: 1n,
                    },
                }));
            });
        });
        describe("Uses nested object", function () {
            it("should return true", function () {
                const model = new Model({
                    a: {type: String},
                    b: {
                        c: Number,
                        d: BigInt,
                    },
                });
                assert.ok(model.confirmMatches({
                    a: "",
                    b: {
                        c: 1,
                        d: 1n,
                    },
                }));
            });
        });
        describe("Uses object in definition", function () {
            it("should return true", function () {
                const model = new Model({
                    a: {type: String},
                    b: {
                        type: {
                            c: Number,
                            d: BigInt,
                        },
                        required: false,
                    },
                });
                assert.ok(model.confirmMatches({
                    a: "",
                    b: {
                        c: 1,
                        d: 1n,
                    },
                }));
                assert.ok(model.confirmMatches({
                    a: "",
                }));
            });
            it("should return false", function () {
                const model = new Model({
                    a: {type: String},
                    b: {
                        type: {
                            c: Number,
                            d: BigInt,
                        },
                        required: false,
                    },
                });
                assert.ok(!model.confirmMatches({
                    a: "",
                    b: {
                        c: 1,
                    },
                }));
                assert.ok(!model.confirmMatches({
                    a: "",
                    b: {
                        c: 1,
                        d: 1n,
                        e: true,
                    },
                }));
            });
        });
        describe("Uses Union", function () {
            const bModel = new Model({
                c: Number,
                d: BigInt,
            });
            const model = new Model({
                a: {type: String},
                b: new Union(String, Boolean, bModel, {foo: BigInt, bar: String}),
            });
            it("should return true", function () {
                assert.ok(model.confirmMatches({
                    a: "",
                    b: "",
                }));
                assert.ok(model.confirmMatches({
                    a: "",
                    b: false,
                }));
                assert.ok(model.confirmMatches({
                    a: "",
                    b: {
                        c: 1,
                        d: 1n,
                    },
                }));
                assert.ok(model.confirmMatches({
                    a: "",
                    b: {
                        foo: 420n,
                        bar: "hello",
                    },
                }));
            });
            it("should return false", function () {
                assert.ok(!model.confirmMatches({
                    a: "",
                    b: 1,
                }));
                assert.ok(!model.confirmMatches({
                    a: "",
                    b: {
                        c: 1,
                        d: 1n,
                        e: 8,
                    },
                }));
                assert.ok(!model.confirmMatches({
                    a: "",
                    b: {
                        c: 1,
                    },
                }));
                assert.ok(!model.confirmMatches({
                    a: "",
                    b: {
                        c: 1,
                        d: "hello",
                    },
                }));
                assert.ok(!model.confirmMatches({
                    a: "",
                    b: {
                        foo: 420n,
                        bar: "hello",
                        toto: "clown",
                    },
                }));
                assert.ok(!model.confirmMatches({
                    a: "",
                    b: {
                        foo: 420n,
                    },
                }));
            });
        });
        describe("Uses array", function () {
            const aModel = new Model({
                b: String,
                c: Number,
            });
            const model = new Model({
                a: [String, Boolean, aModel, {foo: BigInt, bar: String}],
            });
            it("should return true", function () {
                assert.ok(model.confirmMatches({
                    a: ["", false, {b: "hello there", c: 1}, {foo: 420n, bar: "hello"}],
                }));
            });
            it("should return false", function () {
                assert.ok(!model.confirmMatches({
                    a: "",
                }));
                assert.ok(!model.confirmMatches({
                    a: ["", 1],
                }));
            });
        });
    });
});