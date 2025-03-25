import { useState } from "react"
import { createPortal } from "react-dom";
import Modal from "../Modal";
import { LogFileEvent } from "@/model/LogFile";

interface EventBlockProps {
    xPos: number;
    yPos: number;
    size: number;
    colors: string[];
    event: LogFileEvent;
}

export default function EventBlock({xPos, yPos, size, colors, event}: EventBlockProps) {
    const [color, setColor] = useState(colors[0]);
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <rect transform={`translate(${xPos}, ${yPos})`} y={-15} width={size} height={size} rx={5} fill={color} onClick={_ => setShowModal(true)} className="cursor-pointer" onMouseEnter={_ => setColor(colors[1])} onMouseLeave={_ => setColor(colors[0])} />
            {showModal && createPortal(
                <Modal title={"Event details"} code={JSON.stringify(event, null, 4)} handleClose={() => setShowModal(false)} />, document.body
            )}
        </>
    );
}
