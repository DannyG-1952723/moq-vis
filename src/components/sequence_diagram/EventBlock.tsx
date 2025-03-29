import { useEffect, useRef, useState } from "react"
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
    extended: boolean;
    noAction: boolean;
}

const textBgPaddingX = 6;
const textBgPaddingY = 4;

export default function EventBlock({ xPos, yPos, colors, event, startTime, isLeft, extended, noAction }: EventBlockProps) {
    const [color, setColor] = useState(colors.normal);
    const [showModal, setShowModal] = useState(false);

    const textRef = useRef<SVGTextElement>(null);
    const textBgRef = useRef<SVGRectElement>(null);

    useEffect(() => {
        if (!textRef.current || !textBgRef.current) {
            return;
        }

        const boundingBox = textRef.current.getBBox();

        textBgRef.current.setAttribute("x", `${boundingBox.x - textBgPaddingX}`);
        textBgRef.current.setAttribute("y", `${boundingBox.y - textBgPaddingY}`);
        textBgRef.current.setAttribute("width", `${boundingBox.width + 2 * textBgPaddingX}`);
        textBgRef.current.setAttribute("height", `${boundingBox.height + 2 * textBgPaddingY}`);
    }, [event]);

    const anchor = isLeft ? "end" : "start";
    const margin = isLeft ? -5 : BLOCK_SIZE + 5;
    const shortName = noAction ? getShortNameWithoutAction(event.name) : getShortName(event.name);

    return (
        <>
            <g transform={`translate(${xPos}, ${yPos})`}>
                <g className="cursor-pointer" onClick={_ => setShowModal(true)} onMouseEnter={_ => setColor(colors.hover)} onMouseLeave={_ => setColor(colors.normal)}>
                    <rect y={-15} width={BLOCK_SIZE} height={BLOCK_SIZE} rx={5} fill={color} />
                    {extended && <>
                        <rect fill={color} x={15} y={-4} width={50} height={8} />
                        <rect ref={textBgRef} rx={5} fill={color} />
                        <text ref={textRef} x={50} dominantBaseline="central" fill="white">{shortName}</text>
                    </>}
                </g>
                <text x={margin} textAnchor={anchor} dominantBaseline="central" className="font-mono text-[12px]">{event.time - startTime}</text>
            </g>

            {showModal && createPortal(     
                <Modal title={"Event details"} code={JSON.stringify(event, null, 4)} handleClose={() => setShowModal(false)} />, document.body
            )}
        </>
    );
}
