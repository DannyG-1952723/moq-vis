"use client";

import { ChangeEvent, MouseEvent, useState } from "react";

import FileList from "./FileList";
import InlineCode from "./InlineCode";

import { LogFile } from "@/model/LogFile";
import FileInput from "./FileInput";
import Note from "./Note";

export default function FileImport() {
    const [files, setFiles] = useState<LogFile[]>([]);

    function handleImport(event: ChangeEvent<HTMLInputElement>) {
        // Checks if it isn't undefined and isn't null
        if (!event.target.files) {
            return;
        }

        const newFiles: LogFile[] = [];

        for (let i = 0; i < event.target.files.length; i++) {
            const file = event.target.files[i];

            // TODO: Fix so files aren't being listed when invalid (they are listed anyway when invalid now)
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

    function handleDelete(event: MouseEvent<HTMLButtonElement>, fileName: string) {
        event.stopPropagation();

        const newFiles = [...files];
        const fileIndex = newFiles.findIndex(file => file.name === fileName);
        newFiles.splice(fileIndex, 1);
        setFiles(newFiles);
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
        <form className="w-full">
            <FileInput handleImport={handleImport} />
            <Note>Only <InlineCode>.sqlog</InlineCode> files are currently supported</Note>
            <Note>Files won&apos;t be uploaded to the server</Note>
            <FileList files={files} handleDelete={handleDelete} />
        </form>
    );
}
