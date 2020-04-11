class NullObjectError extends Error {
    constructor(...params) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, NullObjectError);
        }

        this.name = "NullObjectError";
        this.date = new Date();
    }
}

module.exports = NullObjectError;
