import { MessageEvent as MsgEvent } from "@/model/Network";
import EventBlock from "./EventBlock";
import MessageEventArrow from "./MessageEventArrow";
import { getColors } from "@/model/util";
import EncompassingBlock from "./EncompassingBlock";

interface MessageEventProps {
    messageEvent: MsgEvent;
    xScale: d3.ScalePoint<string>;
    yScale: d3.ScaleLinear<number, number, never>;
    startTime: number;
    isBlock: boolean;
    id: string;
    handleHover: (id: string | null) => void;
}

export default function MessageEvent({ messageEvent, xScale, yScale, startTime, isBlock, id, handleHover }: MessageEventProps) {
    const createdX = xScale(messageEvent.createdEvent.fileName)!;
    const createdY = yScale(messageEvent.createdEvent.eventNum);
    const parsedX = xScale(messageEvent.parsedEvent.fileName)!;
    const parsedY = yScale(messageEvent.parsedEvent.eventNum);

    const colors = getColors(messageEvent.createdEvent.event);

    const isLeft = createdX < parsedX;

    const isQuicEvent = messageEvent.createdEvent.event.name.startsWith("quic");

    const content = isBlock && !isQuicEvent ?
        <EncompassingBlock messageEvent={messageEvent} x1={createdX} y1={createdY} x2={parsedX} y2={parsedY} colors={colors} id={id} handleHover={handleHover} />
        :
        <MessageEventArrow messageEvent={messageEvent} x1={createdX} y1={createdY} x2={parsedX} y2={parsedY} colors={colors} />;

    return (
        <g className={`message_event ${isQuicEvent ? "quic" : "moq"}`} id={id}>
            <EventBlock xPos={createdX} yPos={createdY} colors={colors} event={messageEvent.createdEvent.event} startTime={startTime} isLeft={isLeft} extended={false} noAction={true} />
            <EventBlock xPos={parsedX} yPos={parsedY} colors={colors} event={messageEvent.parsedEvent.event} startTime={startTime} isLeft={!isLeft} extended={false} noAction={true} />
            
            {content}
        </g>
    );
}
