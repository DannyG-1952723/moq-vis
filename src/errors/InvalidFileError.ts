export class InvalidFileError extends Error {
    constructor(fileName: string) {
        super(`${fileName} is not a valid .sqlog file`);

        Object.setPrototypeOf(this, InvalidFileError.prototype);
    }
}