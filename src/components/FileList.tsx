import { LogFile } from "@/model/LogFile";
import FileDetails from "./FileDetails";
import { MouseEvent } from "react";
import Note from "./Note";

interface FileListProps {
    files: LogFile[];
    handleDelete: (event: MouseEvent<HTMLButtonElement>, fileName: string) => void;
}

export default function FileList({ files, handleDelete }: FileListProps) {
    const fileElements = files.map((file) => <FileDetails key={file.name} file={file} handleDelete={(event: MouseEvent<HTMLButtonElement>) => handleDelete(event, file.name)} />);
    const note = <Note>No files have been imported</Note>;

    return (
        <>
            <h3 className="block mt-5 mb-2 text-md font-medium text-gray-900 dark:text-white">Imported files</h3>
            <div className="flex flex-wrap">{files.length > 0 ? fileElements : note}</div>
        </>
    );
}
