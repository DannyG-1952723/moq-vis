import { ConnectionEvent } from "@/model/Network";
import EventBlock from "./EventBlock";
import { getColors } from "@/model/util";
import HalfMessageEventArrow from "./HalfMessageEventArrow";

interface HalfMessageEventProps {
    event: ConnectionEvent;
    otherFileName: string;
    xScale: d3.ScalePoint<string>;
    yScale: d3.ScaleLinear<number, number, never>;
    startTime: number;
}

export default function HalfMessageEvent({ event, otherFileName, xScale, yScale, startTime }: HalfMessageEventProps) {
    const isCreatedEvent = event.isCreatedEvent();

    const xPos = xScale(event.fileName)!;
    const yPos = yScale(event.eventNum);
    const otherXPos = xScale(otherFileName)!;
    const otherYPos = yScale(event.eventNum + (isCreatedEvent ? 1 : -1));

    const colors = getColors(event.event);

    const isLeft = xPos < otherXPos;

    return (
        <>
            <EventBlock xPos={xPos} yPos={yPos} colors={colors} event={event.event} startTime={startTime} isLeft={isLeft} extended={false} noAction={false} />
            <HalfMessageEventArrow event={event} x1={isCreatedEvent ? xPos : otherXPos} y1={isCreatedEvent ? yPos : otherYPos} x2={isCreatedEvent ? otherXPos : xPos} y2={isCreatedEvent ? otherYPos : yPos} colors={colors} isCreatedEvent={isCreatedEvent} />
        </>
    );
}
