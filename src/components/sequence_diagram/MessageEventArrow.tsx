import { ConnectionEvent } from "@/model/Network";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Modal from "@/components/Modal";
import { MessageEvent } from "@/model/LogFile";
import { ArrowProperties, Colors, getShortNameWithoutAction, radiansToDegrees } from "@/model/util";

interface MessageEventArrowProps {
    createdEvent: ConnectionEvent;
    parsedEvent: ConnectionEvent;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    colors: Colors;
}

const textBgPaddingX = 6;
const textBgPaddingY = 4;

const normalArrowClassName = "stroke-gray-600";
const hoverArrowClassName = "stroke-gray-800";
const normalArrowMarker = "url(#arrow)";
const hoverArrowmarker = "url(#hover-arrow)";

export default function MessageEventArrow({ createdEvent, parsedEvent, x1, y1, x2, y2, colors }: MessageEventArrowProps) {
    const [color, setColor] = useState(colors.normal);
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

        textRef.current.setAttribute("transform", `rotate(${textAngle}, ${textMiddleX}, ${textMiddleY})`);

        textBgRef.current.setAttribute("x", `${boundingBox.x - textBgPaddingX}`);
        textBgRef.current.setAttribute("y", `${boundingBox.y - textBgPaddingY}`);
        textBgRef.current.setAttribute("width", `${boundingBox.width + 2 * textBgPaddingX}`);
        textBgRef.current.setAttribute("height", `${boundingBox.height + 2 * textBgPaddingY}`);
        textBgRef.current.setAttribute("transform", `rotate(${textAngle}, ${textMiddleX}, ${textMiddleY})`);
    }, [createdEvent, parsedEvent]);

    const arrow = new ArrowProperties(x1, y1, x2, y2);

    const [textMiddleX, textMiddleY] = arrow.getMiddleCoords();
    const textAngle = radiansToDegrees(Math.atan(arrow.m));

    const shortName = getShortNameWithoutAction(createdEvent.event.name);

    const messageEvent = new MessageEvent(createdEvent.event, parsedEvent.event);

    return (
        <>
            <g onClick={_ => setShowModal(true)} className="cursor-pointer" onMouseEnter={_ => handleMouseEnter()} onMouseLeave={_ => handleMouseLeave()}>
                <line x1={arrow.arrowStartX} y1={arrow.arrowStartY} x2={arrow.arrowEndX} y2={arrow.arrowEndY} stroke="black" strokeWidth={4} markerEnd={arrowMarker} strokeLinecap="round" className={arrowClassName} />
                <rect ref={textBgRef} rx={5} fill={color} />
                <text ref={textRef} transform={`rotate(${textAngle}, ${textMiddleX}, ${textMiddleY})`} x={textMiddleX} y={textMiddleY} textAnchor="middle" dominantBaseline="central" fill="white">{shortName}</text>
            </g>

            {showModal && createPortal(
                <Modal title={"Message summary"} code={JSON.stringify(messageEvent, null, 4)} handleClose={() => setShowModal(false)} />, document.body
            )}
        </>
    );

    function handleMouseEnter() {
        setColor(colors.hover);
        setArrowClassName(hoverArrowClassName);
        setArrowMarker(hoverArrowmarker);
    }

    function handleMouseLeave() {
        setColor(colors.normal);
        setArrowClassName(normalArrowClassName);
        setArrowMarker(normalArrowMarker);
    }
}
