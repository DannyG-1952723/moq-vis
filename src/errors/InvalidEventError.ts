export class InvalidEventError extends Error {
    constructor(eventName: string, json: any, fileName: string) {
        super(`A '${eventName}' event in ${fileName} has invalid data: ${json}`);

        Object.setPrototypeOf(this, InvalidEventError.prototype);
    }
}
