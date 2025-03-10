"use client";

import FileDetails from "./FileDetails";
import Note from "./Note";
import { useFiles } from "@/contexts/FilesContext";

export default function FileList() {
    const files = useFiles();

    const fileElements = files.map((file) => <FileDetails key={file.name} file={file} />);
    const note = <Note>No files have been imported</Note>;

    return (
        <>
            <h3 className="block mt-5 mb-2 text-md font-medium text-gray-900 dark:text-white">Imported files</h3>
            <div className="flex flex-wrap">{files.length > 0 ? fileElements : note}</div>
        </>
    );
}
