import * as d3 from "d3";
import { Connection as Conn, ConnectionEvent } from "@/model/Network";
import { JSX, useEffect, useState } from "react";
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
}

export default function Connection({ conn, xScale, yScale, startTime, containsQuicEvents }: ConnectionProps) {
    // TODO: Use setHoveredId in the hover function of a MessageEvent with a block
    const [hoveredId, setHoveredId] = useState<number | null>(null);

    const events = createEvents();

    useEffect(() => {
        const messageEvents = d3.selectAll<SVGGElement, string>(".message_event");
        const quicEvents = d3.selectAll<SVGGElement, unknown>(".quic").nodes();
        const moqEvents = d3.selectAll<SVGGElement, unknown>(".moq").nodes();

        let nonHoveredMoqEvents: SVGGElement[] = [];
        let hoveredMoqEvent: SVGGElement[] = [];

        if (hoveredId === null) {
            nonHoveredMoqEvents = moqEvents;
        }
        else {
            nonHoveredMoqEvents = moqEvents.filter(event => event.id !== `${hoveredId}`);
            hoveredMoqEvent = [moqEvents.find(event => event.id === `${hoveredId}`)!];
        }

        const order = [
            ...nonHoveredMoqEvents.map(event => event.id),
            ...hoveredMoqEvent.map(event => event.id),
            ...quicEvents.map(event => event.id)
        ];

        console.log(order);

        messageEvents.data(order, d => d);
        messageEvents.sort((a, b) => order.indexOf(a) - order.indexOf(b));

    }, [events, hoveredId]);

    return (
        <>
            {events}
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
                    events.push(createMessageEvent(event, acceptingConnEvents[index], i));
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

    function createMessageEvent(event1: ConnectionEvent, event2: ConnectionEvent, id: number): JSX.Element {
        if (event1.isCreatedEvent()) {
            return <MessageEvent createdEvent={event1} parsedEvent={event2} xScale={xScale} yScale={yScale} startTime={startTime} isBlock={containsQuicEvents} id={id} />;
        }

        return <MessageEvent createdEvent={event2} parsedEvent={event1} xScale={xScale} yScale={yScale} startTime={startTime} isBlock={containsQuicEvents} id={id} />;
    }

    function createHalfMessageEvent(event: ConnectionEvent, otherFileName: string): JSX.Element {
        return <HalfMessageEvent event={event} otherFileName={otherFileName} xScale={xScale} yScale={yScale} startTime={startTime} />
    }
}
