import { ConnectionEvent } from "@/model/Network";
import EventBlock from "./EventBlock";
import MessageEventArrow from "./MessageEventArrow";
import { getColors } from "@/model/util";

interface MessageEventProps {
    createdEvent: ConnectionEvent;
    parsedEvent: ConnectionEvent;
    xScale: d3.ScalePoint<string>;
    yScale: d3.ScaleLinear<number, number, never>;
    startTime: number;
}

export default function MessageEvent({ createdEvent, parsedEvent, xScale, yScale, startTime }: MessageEventProps) {
    const createdX = xScale(createdEvent.fileName)!;
    const createdY = yScale(createdEvent.eventNum);
    const parsedX = xScale(parsedEvent.fileName)!;
    const parsedY = yScale(parsedEvent.eventNum);

    const colors = getColors(createdEvent.event);

    const isLeft = createdX < parsedX;

    return (
        <>
            <EventBlock xPos={createdX} yPos={createdY} colors={colors} event={createdEvent.event} startTime={startTime} isLeft={isLeft} extended={false} noAction={true} />
            <EventBlock xPos={parsedX} yPos={parsedY} colors={colors} event={parsedEvent.event} startTime={startTime} isLeft={!isLeft} extended={false} noAction={true} />
            <MessageEventArrow createdEvent={createdEvent} parsedEvent={parsedEvent} x1={createdX} y1={createdY} x2={parsedX} y2={parsedY} colors={colors} />
        </>
    );
}
