import { ConnectionEvent } from "@/model/Network";
import { useEffect, useRef } from "react";
import EventBlock from "./EventBlock";

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

const sessionColors = ["#003f5c", "#002f45"];
const announceColors = ["#444e86", "#333a64"];
const subscribeColors = ["#955196", "#703d70"];
const fetchColors = ["#dd5182", "#bd255a"];
const infoColors = ["#ff6e54", "#fe2700"];
const groupColors = ["#ffa600", "#bf7d00"];

export default function MessageEvent({createdEvent, parsedEvent, blockSize, xScale, yScale}: MessageEventProps) {
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

    const colors = getColors(createdEvent);

    return (
        <>
            <EventBlock xPos={createdX} yPos={createdY} size={blockSize} colors={colors} event={createdEvent.event} />
            <EventBlock xPos={parsedX} yPos={parsedY} size={blockSize} colors={colors} event={parsedEvent.event} />
            <line x1={arrowStartX} y1={arrowStartY} x2={arrowEndX} y2={arrowEndY} stroke="black" strokeWidth={4} markerEnd="url(#arrow)" strokeLinecap="round" className="stroke-gray-600" />
            <rect ref={textBgRef} rx={5} fill={colors[0]} />
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

    function getColors(event: ConnectionEvent): string[] {
        const name = event.event.name;

        if (name.includes("stream")) {
            return getColorsByName(event.event.data["stream_type"]);
        }
        else {
            return getColorsByName(name);
        }
    }

    function getColorsByName(name: string): string[] {
        if (name.includes("session")) {
            return sessionColors;
        }
        if (name.includes("announce")) {
            return announceColors;
        }
        if (name.includes("subscription") || name.includes("subscribe")) {
            return subscribeColors;
        }
        if (name.includes("info")) {
            return infoColors;
        }
        if (name.includes("fetch")) {
            return fetchColors;
        }
        if (name.includes("group") || name.includes("frame")) {
            return groupColors;
        }
        else {
            return ["black", "black"];
        }
    }
}
