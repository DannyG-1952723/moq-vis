import * as d3 from "d3";
import { Connection as Conn, ConnectionEvent, MessageEvent as MsgEvent } from "@/model/Network";
import { JSX } from "react";
import MessageEvent from "./MessageEvent";
import HalfMessageEvent from "./HalfMessageEvent";
import EventBlock from "./EventBlock";
import { OTHER_COLORS } from "@/model/util";

interface ConnectionProps {
    conn: Conn;
    xScale: d3.ScalePoint<string>;
    yScale: d3.ScaleLinear<number, number, never>;
    startTime: number;
    containsQuicEvents: boolean;
    startingId: number;
    handleHover: (id: string | null) => void;
}

export default function Connection({ conn, xScale, yScale, startTime, containsQuicEvents, startingId, handleHover }: ConnectionProps) {
    return (
        <>
            {createEvents()}
        </>
    );

    function createEvents(): JSX.Element[] {
        const events: JSX.Element[] = [];

        const fileName1 = conn.startingConn.fileName;
        const fileName2 = conn.acceptingConn.fileName;

        for (let i = 0; i < conn.messageEvents.length; i++) {
            const event = conn.messageEvents[i];
            events.push(createMessageEvent(event, `${startingId + i}`));
        }

        for (const event of conn.halfMessageEvents) {
            const otherFileName = event.event.fileName === fileName1 ? fileName2 : fileName1;
            events.push(createHalfMessageEvent(event.event, otherFileName));
        }

        for (const event of conn.startingConn.connEvents) {
            events.push(createEvent(event));
        }

        for (const event of conn.acceptingConn.connEvents) {
            events.push(createEvent(event));
        }

        return events;
    }

    function createEvent(event: ConnectionEvent): JSX.Element {
        // TODO: Give actual value of 'isLeft'
        return <EventBlock xPos={xScale(event.fileName)!} yPos={yScale(event.eventNum)} colors={OTHER_COLORS} event={event.event} startTime={startTime} isLeft={true} extended={true} noAction={false} />
    }

    function createMessageEvent(messageEvent: MsgEvent, id: string): JSX.Element {
        return <MessageEvent key={id} messageEvent={messageEvent} xScale={xScale} yScale={yScale} startTime={startTime} isBlock={containsQuicEvents} id={id} handleHover={handleHover} />;
    }

    function createHalfMessageEvent(event: ConnectionEvent, otherFileName: string): JSX.Element {
        return <HalfMessageEvent key={event.orderNum} event={event} otherFileName={otherFileName} xScale={xScale} yScale={yScale} startTime={startTime} />
    }
}
