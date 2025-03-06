"use client";

import Button from "./Button";
import InlineCode from "./InlineCode"

export default function FileImport() {
    // TODO: Implement
    function handleImport(e: Event) {
        e.preventDefault();
        console.log("Button pressed");
    }

    return (
        <form>
            <label htmlFor="files">Import file(s): </label>
            <input type="file" id="files" name="files" accept=".sqlog" multiple />
            <p>Only <InlineCode>.sqlog</InlineCode> files are currently supported</p>
            <p>Files won't be uploaded to the server</p>
            <Button type="submit" handleClick={handleImport}>Import</Button>
        </form>
    );
}
