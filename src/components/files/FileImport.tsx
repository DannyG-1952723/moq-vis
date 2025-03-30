import { ChangeEvent, MouseEvent } from "react";

import FileList from "./FileList";
import InlineCode from "@/components/InlineCode";

import { LogFile } from "@/model/LogFile";
import FileInput from "./FileInput";
import Note from "@/components/Note";
import { ActionType, FileAction, useFiles, useFilesDispatch } from "@/contexts/FilesContext";
import Button from "../Button";

export default function FileImport() {
    const files = useFiles();
    const dispatch = useFilesDispatch();

    return (
        <form className="w-full">
            <FileInput handleImport={handleImport} />
            <Note>Only <InlineCode>.sqlog</InlineCode> files are currently supported</Note>
            <Note>Files won&apos;t be uploaded to the server</Note>
            <h3 className="block mt-5 mb-2 text-md font-medium text-gray-900 dark:text-white">Import demo files</h3>
            <Button onClick={handleDemoImport}>Import demo files</Button>
            <FileList />
        </form>
    );

    function handleImport(event: ChangeEvent<HTMLInputElement>) {
        // Checks if it isn't undefined and isn't null
        if (!event.target.files) {
            return;
        }

        handleFileImport(event.target.files);
    }

    function handleDemoImport(event: MouseEvent<HTMLButtonElement>) {
        event.preventDefault();

        fetch("/api/getLogs")
            .then((res) => res.json())
            .then((data) => {
                const importedFiles = data.logs.map((file: { name: string, content: string }) => new File([file.content], file.name));
                handleFileImport(importedFiles);
            });
    }

    function handleFileImport(importedFiles: FileList) {
        const newFiles: LogFile[] = [];

        for (let i = 0; i < importedFiles.length; i++) {
            const file = importedFiles[i];

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

        dispatch!(new FileAction(ActionType.Add, newFiles, true));
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
}
