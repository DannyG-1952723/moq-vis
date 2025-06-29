import { MessageEvent as MsgEvent } from "@/model/Network";
import { useState } from "react";
import { createPortal } from "react-dom";
import Modal from "@/components/Modal";
import { MessageEvent } from "@/model/Events";
import { ArrowProperties, Colors, HOVER_ARROW_CLASS_NAME, HOVER_ARROW_MARKER, NORMAL_ARROW_CLASS_NAME, NORMAL_ARROW_MARKER, radiansToDegrees } from "@/model/util";
import { useTextBackground } from "@/hooks/useTextBackground";

interface MessageEventArrowProps {
    messageEvent: MsgEvent;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    colors: Colors;
}

export default function MessageEventArrow({ messageEvent, x1, y1, x2, y2, colors }: MessageEventArrowProps) {
    const [color, setColor] = useState(colors.normal);
    const [arrowClassName, setArrowClassName] = useState(NORMAL_ARROW_CLASS_NAME);
    const [arrowMarker, setArrowMarker] = useState(NORMAL_ARROW_MARKER);
    const [showModal, setShowModal] = useState(false);

    const arrow = new ArrowProperties(x1, y1, x2, y2);

    const [textMiddleX, textMiddleY] = arrow.getMiddleCoords();
    const textAngle = radiansToDegrees(Math.atan(arrow.m));

    const [textRef, textBgRef] = useTextBackground([messageEvent.createdEvent, messageEvent.parsedEvent], textAngle, textMiddleX, textMiddleY);

    const shortName = messageEvent.createdEvent.event.getShortNameWithoutAction();

    const msgEvent = new MessageEvent(messageEvent.createdEvent.event, messageEvent.parsedEvent.event);

    return (
        <>
            <g onClick={_ => setShowModal(true)} className="cursor-pointer" onMouseEnter={_ => handleMouseEnter()} onMouseLeave={_ => handleMouseLeave()}>
                <line x1={arrow.arrowStartX} y1={arrow.arrowStartY} x2={arrow.arrowEndX} y2={arrow.arrowEndY} stroke="black" strokeWidth={4} markerEnd={arrowMarker} strokeLinecap="round" className={arrowClassName} />
                <rect ref={textBgRef} rx={5} fill={color} />
                <text ref={textRef} transform={`rotate(${textAngle}, ${textMiddleX}, ${textMiddleY})`} x={textMiddleX} y={textMiddleY} textAnchor="middle" dominantBaseline="central" fill="white">{shortName}</text>
            </g>

            {/* TODO: Merge the content of both events in the modal code block */}
            {showModal && createPortal(
                <Modal title={"Message summary"} code={JSON.stringify(msgEvent.summary(), null, 4)} handleClose={() => setShowModal(false)} />, document.body
            )}
        </>
    );

    function handleMouseEnter() {
        setColor(colors.hover);
        setArrowClassName(HOVER_ARROW_CLASS_NAME);
        setArrowMarker(HOVER_ARROW_MARKER);
    }

    function handleMouseLeave() {
        setColor(colors.normal);
        setArrowClassName(NORMAL_ARROW_CLASS_NAME);
        setArrowMarker(NORMAL_ARROW_MARKER);
    }
}
