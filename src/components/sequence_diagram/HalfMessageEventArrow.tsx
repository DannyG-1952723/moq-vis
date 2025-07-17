import { ConnectionEvent } from "@/model/Network";
import { ArrowProperties, Colors, HOVER_ARROW_CLASS_NAME, HOVER_ARROW_MARKER, NORMAL_ARROW_CLASS_NAME, NORMAL_ARROW_MARKER, radiansToDegrees } from "@/model/util";
import { useState } from "react";
import Modal from "../Modal";
import { createPortal } from "react-dom";
import Close from "../icons/Close";
import QuestionMark from "../icons/QuestionMark";
import { useTextBackground } from "@/hooks/useTextBackground";

interface HalfMessageEventArrowProps {
    event: ConnectionEvent;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    colors: Colors;
    isCreatedEvent: boolean;
}

const lengthPercentage = 0.75;
const iconSize = 36;
const iconColors = new Colors("#cc0000", "#a30000", "40");

export default function HalfMessageEventArrow({ event, x1, y1, x2, y2, colors, isCreatedEvent }: HalfMessageEventArrowProps) {
    const [color, setColor] = useState(colors.normal);
    const [iconColor, setIconColor] = useState(iconColors.normal);
    const [arrowClassName, setArrowClassName] = useState(NORMAL_ARROW_CLASS_NAME);
    const [arrowMarker, setArrowMarker] = useState(NORMAL_ARROW_MARKER);
    const [showModal, setShowModal] = useState(false);

    const arrow = new ArrowProperties(x1, y1, x2, y2);
    arrow.setLengthByPercentage(lengthPercentage, isCreatedEvent);

    const [textMiddleX, textMiddleY] = arrow.getMiddleCoords();
    const textAngle = radiansToDegrees(Math.atan(arrow.m));

    const [textRef, textBgRef] = useTextBackground([event, arrow], textAngle, textMiddleX, textMiddleY);

    const shortName = event.event.getShortName();

    const [iconX, iconY] = arrow.getIconCoords(isCreatedEvent);
    const icon = isCreatedEvent ? <Close x={iconX} y={iconY - iconSize / 2} width={iconSize} height={iconSize} color={iconColor} /> : <QuestionMark x={iconX} y={iconY - iconSize / 2} width={iconSize - 8} height={iconSize - 8} fill={iconColor} />;

    return (
        <>
            <g onClick={_ => setShowModal(true)} className="cursor-pointer" onMouseEnter={_ => handleMouseEnter()} onMouseLeave={_ => handleMouseLeave()}>
                <line x1={arrow.arrowStartX} y1={arrow.arrowStartY} x2={arrow.arrowEndX} y2={arrow.arrowEndY} stroke="black" strokeWidth={4} markerEnd={arrowMarker} strokeLinecap="round" className={arrowClassName} />
                <rect ref={textBgRef} rx={5} fill={color} />
                <text ref={textRef} transform={`rotate(${textAngle}, ${textMiddleX}, ${textMiddleY})`} x={textMiddleX} y={textMiddleY} textAnchor="middle" dominantBaseline="central" fill="white">{shortName}</text>
                {icon}
            </g>

            {showModal && createPortal(
                <Modal title={"Event details"} code={JSON.stringify(event.event, null, 4)} handleClose={() => setShowModal(false)} />, document.body
            )}
        </>
    );

    function handleMouseEnter() {
        setColor(colors.hover);
        setIconColor(iconColors.hover);
        setArrowClassName(HOVER_ARROW_CLASS_NAME);
        setArrowMarker(HOVER_ARROW_MARKER);
    }

    function handleMouseLeave() {
        setColor(colors.normal);
        setIconColor(iconColors.normal);
        setArrowClassName(NORMAL_ARROW_CLASS_NAME);
        setArrowMarker(NORMAL_ARROW_MARKER);
    }
}
