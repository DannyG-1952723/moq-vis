import { ConnectionEvent } from "@/model/Network";

interface MessageEventProps {
    createdEvent: ConnectionEvent;
    parsedEvent: ConnectionEvent;
    blockSize: number;
    xScale: d3.ScalePoint<string>;
    yScale: d3.ScaleLinear<number, number, never>;
}

const lineOffset = 8;
const arrowOffset = 15;

export default function MessageEvent({createdEvent, parsedEvent, blockSize, xScale, yScale}: MessageEventProps) {
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
            <text transform={`rotate(${textAngle}, ${textMiddleX}, ${textMiddleY})`} x={textMiddleX} y={textMiddleY} style={{textAnchor: "middle"}}>{shortName}</text>
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
