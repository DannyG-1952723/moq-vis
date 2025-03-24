import { ConnectionEvent } from "@/model/Network";
import { useEffect, useRef } from "react";

interface MessageEventProps {
    createdEvent: ConnectionEvent;
    parsedEvent: ConnectionEvent;
    blockSize: number;
    xScale: d3.ScalePoint<string>;
    yScale: d3.ScaleLinear<number, number, never>;
}

const lineOffset = 8;
const arrowOffset = 15;
const textBgPaddingX = 6;
const textBgPaddingY = 4;

export default function MessageEvent({createdEvent, parsedEvent, blockSize, xScale, yScale}: MessageEventProps) {
    const textRef = useRef<SVGTextElement>(null);
    const textBgRef = useRef<SVGRectElement>(null);

    useEffect(() => {
        if (!textRef.current || !textBgRef.current) {
            console.log("textRef is null");
            return;
        }

        const boundingBox = textRef.current.getBBox();

        textRef.current.setAttribute("transform", `rotate(${textAngle}, ${textMiddleX}, ${textMiddleY}) translate(${0}, ${boundingBox.height / 4})`);

        textBgRef.current.setAttribute("x", `${boundingBox.x - textBgPaddingX}`);
        textBgRef.current.setAttribute("y", `${boundingBox.y - textBgPaddingY}`);
        textBgRef.current.setAttribute("width", `${boundingBox.width + 2 * textBgPaddingX}`);
        textBgRef.current.setAttribute("height", `${boundingBox.height + 2 * textBgPaddingY}`);
        textBgRef.current.setAttribute("transform", `rotate(${textAngle}, ${textMiddleX}, ${textMiddleY}) translate(${0}, ${boundingBox.height / 4})`);
    }, []);

    const createdX = xScale(createdEvent.fileName)!;
    const createdY = yScale(createdEvent.eventNum);
    const parsedX = xScale(parsedEvent.fileName)!;
    const parsedY = yScale(parsedEvent.eventNum);

    const lineStartX = createdX < parsedX ? createdX + blockSize : createdX;
    const lineEndX = createdX < parsedX ? parsedX : parsedX + blockSize;

    // y = m * x + q
    const m = (parsedY - createdY) / (lineEndX - lineStartX);
    const q = createdY - m * lineStartX;

    const arrowStartX = lineStartX < lineEndX ? lineStartX + lineOffset : lineStartX - lineOffset;
    const arrowEndX = lineStartX < lineEndX ? lineEndX - arrowOffset : lineEndX + arrowOffset;

    const arrowStartY = m * arrowStartX + q;
    const arrowEndY = m * arrowEndX + q;

    const textMiddleX = (lineStartX + lineEndX) / 2;
    const textMiddleY = (createdY + parsedY) / 2;
    const textAngle = radiansToDegrees(Math.atan(m));

    const shortName = getShortName(createdEvent.event.name);

    return (
        <>
            <rect transform={`translate(${createdX}, ${createdY})`} y={-15} width={blockSize} height={blockSize} rx={5} />
            <rect transform={`translate(${parsedX}, ${parsedY})`} y={-15} width={blockSize} height={blockSize} rx={5} />
            <line x1={arrowStartX} y1={arrowStartY} x2={arrowEndX} y2={arrowEndY} stroke="black" strokeWidth={3} markerEnd="url(#arrow)" strokeLinecap="round" />
            <rect ref={textBgRef} rx={5} fill="black" />
            <text ref={textRef} transform={`rotate(${textAngle}, ${textMiddleX}, ${textMiddleY})`} x={textMiddleX} y={textMiddleY} style={{textAnchor: "middle"}} fill="white">{shortName}</text>
        </>
    );

    function radiansToDegrees(radians: number) {
        return radians * (180 / Math.PI);
    }

    function getShortName(name: string): string {
        const noNamespace = name.substring(name.lastIndexOf(":") + 1);

        const index = Math.max(noNamespace.indexOf("_created"), noNamespace.indexOf("_parsed"));

        if (index > -1) {
            return noNamespace.substring(0, index);
        }

        return noNamespace;
    }
}
