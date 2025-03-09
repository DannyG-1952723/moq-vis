// List of FileDetails components

import { LogFile } from "@/model/LogFile";
import FileDetails from "./FileDetails";
import { MouseEvent } from "react";

interface FileListProps {
    files: LogFile[];
    handleDelete: (event: MouseEvent<HTMLButtonElement>, fileName: string) => void;
}

export default function FileList({ files, handleDelete }: FileListProps) {
    const fileElements = files.map((file) => <FileDetails key={file.name} file={file} handleDelete={(event: MouseEvent<HTMLButtonElement>) => handleDelete(event, file.name)} />);

    return <div className="flex flex-wrap mt-4">{fileElements}</div>;
}
