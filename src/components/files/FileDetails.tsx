// Toggle button to enable/disable visualizations of file content
// File name (and maybe description)
// Delete button to remove the file from the list (and visualizations)
// Click handler that shows file details on click (and maybe extra options regarding showing MoQ and/or QUIC, which connections to show, ...)

import { LogFile } from "@/model/LogFile";
import { ChangeEvent, MouseEvent, useState } from "react";
import ToggleButton from "@/components/ToggleButton";
import IconButton from "@/components/IconButton";
import Trash from "@/components/icons/Trash";
import Modal from "@/components/Modal";
import { createPortal } from "react-dom";
import { ActionType, FileAction, useFilesDispatch } from "@/contexts/FilesContext";

interface FileDetailsProps {
    file: LogFile;
}

export default function FileDetails({ file }: FileDetailsProps) {
    const dispatch = useFilesDispatch();
    const [showModal, setShowModal] = useState(false);

    function handleDelete(event: MouseEvent<HTMLButtonElement>, file: LogFile) {
        event.stopPropagation();
        dispatch!(new FileAction(ActionType.Delete, [file], file.active));
    }

    function handleToggle(event: ChangeEvent) {
        event.stopPropagation();
        dispatch!(new FileAction(ActionType.Toggle, [file], !file.active));
    }

    return (
        <>
            <div onClick={() => setShowModal(true)} className="mr-2 mb-2 flex cursor-pointer items-center w-2xs px-5 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 gap-x-4">
                <ToggleButton onChange={handleToggle} checked={file.active} />
                <p className="flex-grow truncate">{file.name}</p>
                <IconButton type="button" onClick={(event: MouseEvent<HTMLButtonElement>) => handleDelete(event, file)} icon={<Trash />} />
            </div>
            {showModal && createPortal(
                <Modal title={`Details of ${file.name}`} code={JSON.stringify(file.details, null, 4)} handleClose={() => setShowModal(false)} />,
                document.body
            )}
        </>
    );
}
