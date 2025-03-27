import { Connection as Conn, ConnectionEvent } from "@/model/Network";
import Event from "./Event";
import { JSX } from "react";
import MessageEvent from "./MessageEvent";

interface ConnectionProps {
    conn: Conn;
    xScale: d3.ScalePoint<string>;
    yScale: d3.ScaleLinear<number, number, never>;
    eventBlockSize: number;
    startTime: number;
}

export default function Connection({ conn, xScale, yScale, eventBlockSize, startTime }: ConnectionProps) {
    function createEvents(): JSX.Element[] {
        const events: JSX.Element[] = [];

        // Copies the array
        let acceptingConnEvents = [...conn.acceptingConn.connEvents];

        for (let i = 0; i < conn.startingConn.connEvents.length; i++) {
            const event = conn.startingConn.connEvents[i];

            if (event.isMessageEvent()) {
                const index = findCorrespondingEvent(event, acceptingConnEvents);

                if (index === -1) {
                    // TODO: Create message event that doesn't arrive at the receiver
                    events.push(createEvent(event));
                }
                else {
                    events.push(createMessageEvent(event, acceptingConnEvents[index]));
                    acceptingConnEvents.splice(index, 1);
                }
            }
            else {
                events.push(createEvent(event));
            }
        }

        // There shouldn't be any message events left
        for (let i = 0; i < acceptingConnEvents.length; i++) {
            events.push(createEvent(acceptingConnEvents[i]));
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
        return <Event event={event} blockSize={eventBlockSize} xScale={xScale} yScale={yScale} />;
    }

    function createMessageEvent(event1: ConnectionEvent, event2: ConnectionEvent): JSX.Element {
        // TODO: Check which one is 'created' and which one is 'parsed'
        if (event1.isCreatedEvent()) {
            return <MessageEvent createdEvent={event1} parsedEvent={event2} blockSize={eventBlockSize} xScale={xScale} yScale={yScale} startTime={startTime} />;
        }

        return <MessageEvent createdEvent={event2} parsedEvent={event1} blockSize={eventBlockSize} xScale={xScale} yScale={yScale} startTime={startTime} />;
    }

    return (
        <>
            {createEvents()}
        </>
    );
}
