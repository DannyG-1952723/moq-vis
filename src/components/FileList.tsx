// List of FileDetails components

import { LogFile } from "@/model/LogFile";
import FileDetails from "./FileDetails";
import { MouseEvent } from "react";

interface FileListProps {
    files: LogFile[];
}

// TODO: Implement
export default function FileList({ files }: FileListProps) {
    function handleDelete(event: MouseEvent<HTMLButtonElement>) {
        event.stopPropagation();
        console.log("Delete clicked: " + event.target);
    }

    const fileElements = files.map((file) => <FileDetails key={file.name} file={file} handleDelete={handleDelete} />);

    return <div className="flex flex-wrap mt-4">{fileElements}</div>;
}
