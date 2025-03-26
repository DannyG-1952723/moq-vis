import { ConnectionEvent } from "@/model/Network";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Modal from "@/components/Modal";
import { MessageEvent } from "@/model/LogFile";

interface MessageEventArrowProps {
    createdEvent: ConnectionEvent;
    parsedEvent: ConnectionEvent;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    blockSize: number;
    colors: string[];
}

const lineOffset = 8;
const arrowOffset = 15;
const textBgPaddingX = 6;
const textBgPaddingY = 4;

const normalArrowClassName = "stroke-gray-600";
const hoverArrowClassName = "stroke-gray-800";
const normalArrowMarker = "url(#arrow)";
const hoverArrowmarker = "url(#hover-arrow)";

export default function MessageEventArrow({createdEvent, parsedEvent, x1, y1, x2, y2, blockSize, colors}: MessageEventArrowProps) {
    const [color, setColor] = useState(colors[0]);
    const [arrowClassName, setArrowClassName] = useState(normalArrowClassName);
    const [arrowMarker, setArrowMarker] = useState(normalArrowMarker);
    const [showModal, setShowModal] = useState(false);

    const textRef = useRef<SVGTextElement>(null);
    const textBgRef = useRef<SVGRectElement>(null);

    useEffect(() => {
        if (!textRef.current || !textBgRef.current) {
            return;
        }

        const boundingBox = textRef.current.getBBox();

        textRef.current.setAttribute("transform", `rotate(${textAngle}, ${textMiddleX}, ${textMiddleY}) translate(${0}, ${boundingBox.height / 4})`);

        textBgRef.current.setAttribute("x", `${boundingBox.x - textBgPaddingX}`);
        textBgRef.current.setAttribute("y", `${boundingBox.y - textBgPaddingY}`);
        textBgRef.current.setAttribute("width", `${boundingBox.width + 2 * textBgPaddingX}`);
        textBgRef.current.setAttribute("height", `${boundingBox.height + 2 * textBgPaddingY}`);
        textBgRef.current.setAttribute("transform", `rotate(${textAngle}, ${textMiddleX}, ${textMiddleY}) translate(${0}, ${boundingBox.height / 4})`);
    }, [createdEvent, parsedEvent]);

    function handleMouseEnter() {
        setColor(colors[1]);
        setArrowClassName(hoverArrowClassName);
        setArrowMarker(hoverArrowmarker);
    }

    function handleMouseLeave() {
        setColor(colors[0]);
        setArrowClassName(normalArrowClassName);
        setArrowMarker(normalArrowMarker);
    }

    const lineStartX = x1 < x2 ? x1 + blockSize : x1;
    const lineEndX = x1 < x2 ? x2 : x2 + blockSize;

    // y = m * x + q
    const m = (y2 - y1) / (lineEndX - lineStartX);
    const q = y1 - m * lineStartX;

    const arrowStartX = lineStartX < lineEndX ? lineStartX + lineOffset : lineStartX - lineOffset;
    const arrowEndX = lineStartX < lineEndX ? lineEndX - arrowOffset : lineEndX + arrowOffset;

    const arrowStartY = m * arrowStartX + q;
    const arrowEndY = m * arrowEndX + q;

    const textMiddleX = (lineStartX + lineEndX) / 2;
    const textMiddleY = (y1 + y2) / 2;
    const textAngle = radiansToDegrees(Math.atan(m));

    const shortName = getShortName(createdEvent.event.name);

    const messageEvent = new MessageEvent(createdEvent.event, parsedEvent.event);

    return (
        <>
            <g onClick={_ => setShowModal(true)} className="cursor-pointer" onMouseEnter={_ => handleMouseEnter()} onMouseLeave={_ => handleMouseLeave()}>
                <line x1={arrowStartX} y1={arrowStartY} x2={arrowEndX} y2={arrowEndY} stroke="black" strokeWidth={4} markerEnd={arrowMarker} strokeLinecap="round" className={arrowClassName} />
                <rect ref={textBgRef} rx={5} fill={color} />
                <text ref={textRef} transform={`rotate(${textAngle}, ${textMiddleX}, ${textMiddleY})`} x={textMiddleX} y={textMiddleY} style={{textAnchor: "middle"}} fill="white">{shortName}</text>
            </g>

            {showModal && createPortal(
                <Modal title={"Message summary"} code={JSON.stringify(messageEvent, null, 4)} handleClose={() => setShowModal(false)} />, document.body
            )}
        </>
    );
}

function getShortName(name: string): string {
    const noNamespace = name.substring(name.lastIndexOf(":") + 1);

    const index = Math.max(noNamespace.indexOf("_created"), noNamespace.indexOf("_parsed"));

    if (index > -1) {
        return noNamespace.substring(0, index);
    }

    return noNamespace;
}

function radiansToDegrees(radians: number) {
    return radians * (180 / Math.PI);
}
