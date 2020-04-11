const {NullObjectError} = require("../errors");
const {Union, Any} = require("./types");


class Model {

    constructor(model) {
        if (typeof model === "object") {
            if (model !== null) {
                this.model = {};
                const keys = Object.keys(model);
                for (const key of keys) {
                    this.model[key] = createJsonType(model[key]);
                }
            } else {
                throw new NullObjectError("model can't be null");
            }
        } else {
            throw new TypeError(`model should be an object. Instead, its type is ${typeof model}`);
        }
    }

    confirmMatches = object => {
        let matches = true;
        for (const key of Object.keys(object)) {
            if (!Object.keys(this.model).includes(key)) {
                matches = false;
                break;
            }
        }
        if (matches) {
            for (const key of Object.keys(this.model)) {
                if (!this.model[key].respectRules(object[key])) {
                    matches = false;
                    break;
                }
            }
        }
        return matches;
    };
}

const createJsonType = (definition) => {
    let type;
    if (typeof definition === "function") {
        type = createJsonTypeFromFunction(definition);
    } else if (typeof definition === "object") {
        if (Array.isArray(definition)) {
            type = createJsonTypeFromArray(definition);
        } else if (isDefinition(definition)) {
            type = createJsonTypeFromDefinition(definition);
        } else if (definition instanceof Model) {
            type = createJsonTypeFromModel(definition);
        } else if (definition instanceof Union) {
            type = createJsonTypeFromUnion(definition);
        } else {
            type = createJsonTypeFromObject(definition);
        }
    }
    return type;
};

const isDefinition = definition => {
    return Object.keys(definition).includes("type") &&
        (typeof definition.type === "function" || typeof definition.type === "object");
};

const createJsonTypeFromFunction = definition => {
    return new JsonType({type: definition});
};

const createJsonTypeFromArray = definition => {
    const array = validateArray(definition);
    return new JsonType({type: array});
};

const createJsonTypeFromUnion = definition => {
    const array = validateUnion(definition);
    return new JsonType({type: array});
};

const createJsonTypeFromModel = model => {
    return new JsonType({type: model});
};

const createJsonTypeFromDefinition = definition => {
    if (typeof definition.type === "object") {
        if (definition.type instanceof Union) {
            definition.type = validateUnion(definition.type);
        } else if (Array.isArray(definition.type)) {
            definition.type = validateArray(definition.type);
        } else if (!(definition.type instanceof Model)) {
            definition.type = new Model(definition.type);
        }
    }
    return new JsonType(definition);
};

const createJsonTypeFromObject = object => {
    const model = new Model(object);
    return createJsonTypeFromModel(model);
};

const validateUnion = union => {
    for (let i = 0; i < union.types.length; i++) {
        const type = union.types[i];
        if (typeof type === "object") {
            if (!(type instanceof Model)) {
                union.types[i] = new Model(type);
            }
        }
    }
    return union;
};

const validateArray = array => {
    for (let i = 0; i < array.length; i++) {
        const type = array[i];
        if (typeof type === "object") {
            if (!(type instanceof Model)) {
                array[i] = new Model(type);
            }
        }
    }
    return array;
};

class JsonType {

    constructor(definition) {
        this.type = definition.type;
        if (typeof definition.required !== "undefined") {
            if (typeof definition.required !== "boolean") {
                throw new TypeError(
                    `Type of required must be "boolean". It currently is "${typeof definition.required}"`);
            }
            this.required = definition.required;
        } else {
            this.required = true;
        }
        if (typeof definition.validation !== "undefined") {
            if (typeof definition.validation !== "function") {
                throw new TypeError(
                    `Type of validation must be "function". It currently is "${typeof definition.required}"`);
            }
            this.validation = definition.validation;
        } else {
            this.validation = paramValue => {
                return true;
            };
        }

    }

    respectRules = paramValue => {
        let respects = true;
        if (typeof paramValue === "undefined") {
            if (this.required) {
                respects = false;
            }
        } else {
            if (!validateType(this.type, paramValue)) {
                respects = false;
            } else {
                if (!this.validation(paramValue)) {
                    respects = false;
                }
            }
        }
        return respects;
    };

}

const validateType = (type, paramValue) => {
    let isValid = false;
    switch (type) {
        case Any:
            isValid = true;
            break;
        case Array:
            isValid = Array.isArray(paramValue);
            break;
        case String:
            isValid = typeof paramValue === "string";
            break;
        case Number:
            isValid = typeof paramValue === "number";
            break;
        case BigInt:
            isValid = typeof paramValue === "bigint";
            break;
        case Boolean:
            isValid = typeof paramValue === "boolean";
            break;
        case Object:
            isValid = typeof paramValue === "object";
            break;
        case undefined:
            isValid = true;
            break;
        default:
            if (typeof type === "object") {
                if (type instanceof Model) {
                    isValid = typeof paramValue === "object" && type.confirmMatches(paramValue);
                } else if (type instanceof Union) {
                    for (const typeElement of type.types) {
                        if (validateType(typeElement, paramValue)) {
                            isValid = true;
                            break;
                        }
                    }
                } else if (Array.isArray(type)) {
                    if (Array.isArray(paramValue)) {
                        let allGood = true;
                        for (const paramValueElement of paramValue) {
                            let goodTypeFound = false;
                            for (const possibleType of type) {
                                if (validateType(possibleType, paramValueElement)) {
                                    goodTypeFound = true;
                                    break;
                                }
                            }
                            if (!goodTypeFound) {
                                allGood = false;
                                break;
                            }
                        }
                        isValid = allGood;
                    }
                }
            }
            break;
    }
    return isValid;
};

module.exports = Model;
