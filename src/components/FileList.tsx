// List of FileDetails components

import { LogFile } from "@/model/LogFile";

interface FileListProps {
    files: LogFile[];
}

// TODO: Implement
export default function FileList({ files }: FileListProps) {
    const fileElements = files.map((file) => <li key={file.name}>{file.name}</li>);

    return <ul>{fileElements}</ul>;
}
