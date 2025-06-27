import { ConnectionEvent } from "@/model/Network";
import { BLOCK_SIZE, Colors } from "@/model/util";
import { useState } from "react";
import { createPortal } from "react-dom";
import Modal from "@/components/Modal";
import { MessageEvent } from "@/model/Events";

const SPACING = 5;
const ARROW_WIDTH = 20;
const ARROW_WIDTH_HOVER = 22;
const BORDER_WIDTH = 4;
const BORDER_WIDTH_HOVER = 6;

interface EncompassingBlockProps {
    createdEvent: ConnectionEvent;
    parsedEvent: ConnectionEvent;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    colors: Colors;
    id: string;
    handleHover: (id: string | null) => void;
}

export default function EncompassingBlock({ createdEvent, parsedEvent, x1, y1, x2, y2, colors, id, handleHover }: EncompassingBlockProps) {
    const [fillColor, setFillColor] = useState(colors.transparentNormal);
    const [borderColor, setBorderColor] = useState(colors.normal);
    const [borderWidth, setBorderWidth] = useState(BORDER_WIDTH);
    const [arrowWidth, setArrowWidth] = useState(ARROW_WIDTH);
    const [showModal, setShowModal] = useState(false);

    const topLeftX = (x1 < x2 ? x1 : x2) + BLOCK_SIZE + SPACING + borderWidth / 2;
    const topLeftY = (y1 < y2 ? y1 - BLOCK_SIZE / 2 : y2) + borderWidth / 2;
    const bottomRightX = ((x1 < x2 ? x2 : x1) - SPACING) - borderWidth / 2;
    const bottomRightY = (y1 < y2 ? y2 + BLOCK_SIZE / 2 : y1) - borderWidth / 2;

    const textMiddleX = topLeftX + (bottomRightX - topLeftX) / 2;
    const textY = topLeftY + 25;

    const arrowLeftSide = textMiddleX - arrowWidth / 2;
    const arrowRightSide = arrowLeftSide + arrowWidth;
    const arrowPointX = (x1 < x2) ? arrowRightSide : arrowLeftSide;
    const arrowSideX = (x1 < x2) ? arrowLeftSide : arrowRightSide;
    const topArrowTopY = topLeftY - arrowWidth / 2;
    const topArrowBottomY = topArrowTopY + arrowWidth;
    const bottomArrowTopY = bottomRightY - arrowWidth / 2;
    const bottomArrowBottomY = bottomArrowTopY + arrowWidth;

    const shortName = createdEvent.event.getShortNameWithoutAction();

    const messageEvent = new MessageEvent(createdEvent.event, parsedEvent.event);

    return (
        <>
            <g onClick={_ => setShowModal(true)} className="cursor-pointer" onMouseEnter={_ => handleMouseEnter()} onMouseLeave={_ => handleMouseLeave()}>
                <rect x={topLeftX} y={topLeftY} width={bottomRightX - topLeftX} height={bottomRightY - topLeftY} rx={5} fill={fillColor} stroke={borderColor} strokeWidth={borderWidth} />
                <polygon points={`${arrowPointX},${topLeftY} ${arrowSideX},${topArrowTopY} ${arrowSideX},${topArrowBottomY}`} fill={borderColor} />
                <polygon points={`${arrowPointX},${bottomRightY} ${arrowSideX},${bottomArrowTopY} ${arrowSideX},${bottomArrowBottomY}`} fill={borderColor} />
                <text x={textMiddleX} y={textY} textAnchor="middle" >{shortName}</text>
            </g>

            {/* TODO: Merge the content of both events in the modal code block */}
            {showModal && createPortal(
                <Modal title={"Message summary"} code={JSON.stringify(messageEvent.summary(), null, 4)} handleClose={() => setShowModal(false)} />, document.body
            )}
        </>
    );

    function handleMouseEnter() {
        handleHover(id);
        setFillColor(colors.transparentHover);
        setBorderColor(colors.hover);
        setBorderWidth(BORDER_WIDTH_HOVER);
        setArrowWidth(ARROW_WIDTH_HOVER);
    }

    function handleMouseLeave() {
        handleHover(null);
        setFillColor(colors.transparentNormal);
        setBorderColor(colors.normal);
        setBorderWidth(BORDER_WIDTH);
        setArrowWidth(ARROW_WIDTH);
    }
}
