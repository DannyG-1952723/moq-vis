import { ConnectionEvent } from "@/model/Network";
import { ArrowProperties, Colors, getShortName, radiansToDegrees } from "@/model/util";
import { useEffect, useRef, useState } from "react";
import Modal from "../Modal";
import { createPortal } from "react-dom";
import Close from "../icons/Close";
import QuestionMark from "../icons/QuestionMark";

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

const textBgPaddingX = 6;
const textBgPaddingY = 4;

const normalArrowClassName = "stroke-gray-600";
const hoverArrowClassName = "stroke-gray-800";
const normalArrowMarker = "url(#arrow)";
const hoverArrowmarker = "url(#hover-arrow)";
const iconColors = new Colors("#cc0000", "#a30000");

export default function HalfMessageEventArrow({ event, x1, y1, x2, y2, colors, isCreatedEvent }: HalfMessageEventArrowProps) {
    const [color, setColor] = useState(colors.normal);
    const [iconColor, setIconColor] = useState(iconColors.normal);
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
    }, [event]);

    const arrow = new ArrowProperties(x1, y1, x2, y2);
    arrow.setLengthByPercentage(lengthPercentage, isCreatedEvent);

    const [textMiddleX, textMiddleY] = arrow.getMiddleCoords();
    const textAngle = radiansToDegrees(Math.atan(arrow.m));

    const shortName = getShortName(event.event.name);

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
        setArrowClassName(hoverArrowClassName);
        setArrowMarker(hoverArrowmarker);
    }

    function handleMouseLeave() {
        setColor(colors.normal);
        setIconColor(iconColors.normal);
        setArrowClassName(normalArrowClassName);
        setArrowMarker(normalArrowMarker);
    }
}
