import { ConnectionEvent } from "@/model/Network";
import EventBlock from "./EventBlock";
import MessageEventArrow from "./MessageEventArrow";

interface MessageEventProps {
    createdEvent: ConnectionEvent;
    parsedEvent: ConnectionEvent;
    blockSize: number;
    xScale: d3.ScalePoint<string>;
    yScale: d3.ScaleLinear<number, number, never>;
}

const sessionColors = ["#003f5c", "#002f45"];
const announceColors = ["#444e86", "#333a64"];
const subscribeColors = ["#955196", "#703d70"];
const fetchColors = ["#dd5182", "#bd255a"];
const infoColors = ["#ff6e54", "#fe2700"];
const groupColors = ["#ffa600", "#bf7d00"];

export default function MessageEvent({createdEvent, parsedEvent, blockSize, xScale, yScale}: MessageEventProps) {
    const createdX = xScale(createdEvent.fileName)!;
    const createdY = yScale(createdEvent.eventNum);
    const parsedX = xScale(parsedEvent.fileName)!;
    const parsedY = yScale(parsedEvent.eventNum);

    const colors = getColors(createdEvent);

    return (
        <>
            <EventBlock xPos={createdX} yPos={createdY} size={blockSize} colors={colors} event={createdEvent.event} />
            <EventBlock xPos={parsedX} yPos={parsedY} size={blockSize} colors={colors} event={parsedEvent.event} />
            <MessageEventArrow createdEvent={createdEvent} parsedEvent={parsedEvent} x1={createdX} y1={createdY} x2={parsedX} y2={parsedY} blockSize={blockSize} colors={colors} />
        </>
    );
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
