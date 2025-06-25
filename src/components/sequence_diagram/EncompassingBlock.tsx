import * as d3 from "d3";
import { ConnectionEvent } from "@/model/Network";
import { BLOCK_SIZE, Colors } from "@/model/util";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Modal from "@/components/Modal";
import { MessageEvent } from "@/model/Events";

interface EncompassingBlockProps {
    createdEvent: ConnectionEvent;
    parsedEvent: ConnectionEvent;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    colors: Colors;
}

export default function EncompassingBlock({ createdEvent, parsedEvent, x1, y1, x2, y2, colors }: EncompassingBlockProps) {
    const [fillColor, setFillColor] = useState(colors.transparentNormal);
    const [borderColor, setBorderColor] = useState(colors.normal);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const top = d3.selectAll("#top");
    })

    const SPACING = 5;
    const BORDER_WIDTH = 4;

    const topLeftX = (x1 < x2 ? x1 : x2) + BLOCK_SIZE + SPACING + BORDER_WIDTH / 2;
    const topLeftY = (y1 < y2 ? y1 - BLOCK_SIZE / 2 : y2) + BORDER_WIDTH / 2;
    const bottomRightX = ((x1 < x2 ? x2 : x1) - SPACING) - BORDER_WIDTH / 2;
    const bottomRightY = (y1 < y2 ? y2 + BLOCK_SIZE / 2 : y1) - BORDER_WIDTH / 2;

    const shortName = createdEvent.event.getShortNameWithoutAction();

    const messageEvent = new MessageEvent(createdEvent.event, parsedEvent.event);

    return (
        <>
            <g onClick={_ => setShowModal(true)} className="cursor-pointer" onMouseEnter={_ => handleMouseEnter()} onMouseLeave={_ => handleMouseLeave()}>
                <rect x={topLeftX} y={topLeftY} width={bottomRightX - topLeftX} height={bottomRightY - topLeftY} rx={5} fill={fillColor} stroke={borderColor} strokeWidth={BORDER_WIDTH} />
            </g>

            {/* TODO: Merge the content of both events in the modal code block */}
            {showModal && createPortal(
                <Modal title={"Message summary"} code={JSON.stringify(messageEvent.summary(), null, 4)} handleClose={() => setShowModal(false)} />, document.body
            )}
        </>
    );

    function handleMouseEnter() {
        // TODO: Implement
        setFillColor(colors.transparentHover);
        setBorderColor(colors.hover);
    }

    function handleMouseLeave() {
        // TODO: Implement
        setFillColor(colors.transparentNormal);
        setBorderColor(colors.normal);
    }
}
