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
    startTime: number;
    isLeft: boolean;
}

export default function EventBlock({ xPos, yPos, size, colors, event, startTime, isLeft }: EventBlockProps) {
    const [color, setColor] = useState(colors[0]);
    const [showModal, setShowModal] = useState(false);

    const anchor = isLeft ? "end" : "start";
    const margin = isLeft ? -5 : 35;

    return (
        <>
            <g transform={`translate(${xPos}, ${yPos})`}>
                <rect y={-15} width={size} height={size} rx={5} fill={color} className="cursor-pointer" onClick={_ => setShowModal(true)} onMouseEnter={_ => setColor(colors[1])} onMouseLeave={_ => setColor(colors[0])} />
                <text x={margin} textAnchor={anchor} dominantBaseline="middle" className="font-mono text-[12px]">{event.time - startTime}</text>
            </g>

            {showModal && createPortal(     
                <Modal title={"Event details"} code={JSON.stringify(event, null, 4)} handleClose={() => setShowModal(false)} />, document.body
            )}
        </>
    );
}
