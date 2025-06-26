import * as d3 from "d3";
import { Connection as Conn, ConnectionEvent } from "@/model/Network";
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

        // Copies the array
        const acceptingConnEvents = [...conn.acceptingConn.connEvents];

        for (let i = 0; i < conn.startingConn.connEvents.length; i++) {
            const event = conn.startingConn.connEvents[i];

            if (event.isMessageEvent()) {
                const index = findCorrespondingEvent(event, acceptingConnEvents);

                if (index === -1) {
                    events.push(createHalfMessageEvent(event, conn.acceptingConn.fileName));
                }
                else {
                    events.push(createMessageEvent(event, acceptingConnEvents[index], `${startingId + i}`));
                    acceptingConnEvents.splice(index, 1);
                }
            }
            else {
                events.push(createEvent(event));
            }
        }

        // There shouldn't be any message events left (except maybe at the end when abruptly ending connections)
        for (let i = 0; i < acceptingConnEvents.length; i++) {
            events.push(createHalfMessageEvent(acceptingConnEvents[i], conn.startingConn.fileName));
        }

        return events;
    }

    function findCorrespondingEvent(event: ConnectionEvent, events: ConnectionEvent[]): number {
        for (let i = 0; i < events.length; i++) {
            if (event.isCorrespondingEvent(events[i])) {
                return i;
            }
        }

        return -1;
    }

    function createEvent(event: ConnectionEvent): JSX.Element {
        // TODO: Give actual value of 'isLeft'
        return <EventBlock xPos={xScale(event.fileName)!} yPos={yScale(event.eventNum)} colors={OTHER_COLORS} event={event.event} startTime={startTime} isLeft={true} extended={true} noAction={false} />
    }

    function createMessageEvent(event1: ConnectionEvent, event2: ConnectionEvent, id: string): JSX.Element {
        if (event1.isCreatedEvent()) {
            return <MessageEvent createdEvent={event1} parsedEvent={event2} xScale={xScale} yScale={yScale} startTime={startTime} isBlock={containsQuicEvents} id={id} handleHover={handleHover} />;
        }

        return <MessageEvent createdEvent={event2} parsedEvent={event1} xScale={xScale} yScale={yScale} startTime={startTime} isBlock={containsQuicEvents} id={id} handleHover={handleHover} />;
    }

    function createHalfMessageEvent(event: ConnectionEvent, otherFileName: string): JSX.Element {
        return <HalfMessageEvent event={event} otherFileName={otherFileName} xScale={xScale} yScale={yScale} startTime={startTime} />
    }
}
