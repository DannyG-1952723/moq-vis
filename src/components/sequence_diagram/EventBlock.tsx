import { useState } from "react"
import { createPortal } from "react-dom";
import Modal from "../Modal";
import { LogFileEvent } from "@/model/LogFile";
import { BLOCK_SIZE, Colors, getShortName, getShortNameWithoutAction } from "@/model/util";

interface EventBlockProps {
    xPos: number;
    yPos: number;
    colors: Colors;
    event: LogFileEvent;
    startTime: number;
    isLeft: boolean;
}

export default function EventBlock({ xPos, yPos, colors, event, startTime, isLeft }: EventBlockProps) {
    const [color, setColor] = useState(colors.normal);
    const [showModal, setShowModal] = useState(false);

    const anchor = isLeft ? "end" : "start";
    const margin = isLeft ? -5 : BLOCK_SIZE + 5;

    return (
        <>
            <g transform={`translate(${xPos}, ${yPos})`}>
                <g className="cursor-pointer" onClick={_ => setShowModal(true)} onMouseEnter={_ => setColor(colors.hover)} onMouseLeave={_ => setColor(colors.normal)}>
                    <rect y={-15} width={BLOCK_SIZE} height={BLOCK_SIZE} rx={5} fill={color} />
                </g>
                <text x={margin} textAnchor={anchor} dominantBaseline="central" className="font-mono text-[12px]">{event.time - startTime}</text>
            </g>

            {showModal && createPortal(     
                <Modal title={"Event details"} code={JSON.stringify(event, null, 4)} handleClose={() => setShowModal(false)} />, document.body
            )}
        </>
    );
}
