// Toggle button to enable/disable visualizations of file content
// File name (and maybe description)
// Delete button to remove the file from the list (and visualizations)
// Click handler that shows file details on click (and maybe extra options regarding showing MoQ and/or QUIC, which connections to show, ...)

import { LogFile } from "@/model/LogFile";
import { MouseEvent, useState } from "react";
import ToggleButton from "./ToggleButton";
import IconButton from "./IconButton";
import Trash from "./icons/Trash";
import FileDetailsModal from "./FileDetailsModal";
import { createPortal } from "react-dom";

interface FileDetailsProps {
    file: LogFile;
    handleDelete: (event: MouseEvent<HTMLButtonElement>) => void;
}

export default function FileDetails({ file, handleDelete }: FileDetailsProps) {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <div onClick={() => setShowModal(true)} className="mr-2 mb-2 flex cursor-pointer items-center w-2xs px-5 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 gap-x-4">
                <ToggleButton />
                <p className="flex-grow truncate">{file.name}</p>
                <IconButton type="button" onClick={handleDelete} icon={<Trash />} />
            </div>
            {showModal && createPortal(
                <FileDetailsModal fileName={file.name} fileDetails={JSON.stringify(file.details, null, 4)} handleClose={() => setShowModal(false)} />,
                document.body
            )}
        </>
    );
}
