"use client";

import { ChangeEvent, useState } from "react";

import FileList from "./FileList";
import InlineCode from "./InlineCode";

import { LogFile } from "@/model/LogFile";

export default function FileImport() {
    const [files, setFiles] = useState<LogFile[]>([]);

    // TODO: Implement
    function handleImport(event: ChangeEvent<HTMLInputElement>) {
        // Checks if it isn't undefined and isn't null
        if (!event.target.files) {
            return;
        }

        let newFiles: LogFile[] = [];

        for (let i = 0; i < event.target.files.length; i++) {
            const file = event.target.files[i];

            try {
                if (!containsFile(files, file.name)) {
                    newFiles.push(new LogFile(file));
                }
            }
            catch(err) {
                // TODO: Maybe display an error outside of the console
                console.log(err);
            }
        }

        setFiles([...files, ...newFiles])
    }

    // Just checks based on file name
    function containsFile(files: LogFile[], fileName: string): boolean {
        for (let i = 0; i < files.length; i++) {
            if (files[i].name === fileName) {
                return true;
            }
        }

        return false;
    }

    return (
        <form>
            <label htmlFor="files">Import file(s): </label>
            <input type="file" id="files" name="files" accept=".sqlog" multiple onChange={handleImport} />
            <p>Only <InlineCode>.sqlog</InlineCode> files are currently supported</p>
            <p>Files won't be uploaded to the server</p>
            <FileList files={files} />
        </form>
    );
}
