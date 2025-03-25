import { MouseEventHandler } from "react";
import CodeBlock from "@/components/CodeBlock";
import IconButton from "@/components/IconButton";
import Close from "@/components/icons/Close";

interface ModalProps {
    title: string;
    code: string;
    handleClose: MouseEventHandler;
}

export default function Modal({ title, code, handleClose }: ModalProps) {
    const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) {
            handleClose(event);
        }
    };

    return (
        <div onClick={handleOverlayClick} tabIndex={-1} className="fixed inset-0 z-50 flex justify-center items-center bg-black/50">
            <div className="relative p-4 w-full max-w-2xl max-h-full">
                <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {title}
                        </h3>
                        <IconButton type="button" onClick={handleClose} icon={<Close />} />
                    </div>
                    <CodeBlock>
                        {code}
                    </CodeBlock>
                </div>
            </div>
        </div>
    );
}
