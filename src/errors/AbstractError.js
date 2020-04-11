class AbstractError extends Error {
    constructor(...params) {
        super(...params);

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AbstractError);
        }

        this.name = "AbstractError";
        this.date = new Date();
    }
}

module.exports = AbstractError;