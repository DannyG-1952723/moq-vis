import { Connection as Conn, ConnectionEvent } from "@/model/Network";
import Axis from "./Axis";
import Event from "./Event";
import { JSX } from "react";

interface ConnectionProps {
    conn: Conn;
    xScale: d3.ScalePoint<string>;
    yScale: d3.ScaleLinear<number, number, never>;
    height: number;
    eventBlockSize: number;
}

export default function Connection({ conn, xScale, yScale, height, eventBlockSize }: ConnectionProps) {
    function createEvent(event: ConnectionEvent): JSX.Element {
        return <Event event={event} blockSize={eventBlockSize} xScale={xScale} yScale={yScale} />;
    }

    return (
        <>
            <Axis xPos={xScale(conn.startingConn.fileName)! + eventBlockSize / 2} yPos={0} height={height} fileName={conn.startingConn.fileName} />
            <Axis xPos={xScale(conn.acceptingConn.fileName)! + eventBlockSize / 2} yPos={0} height={height} fileName={conn.acceptingConn.fileName} />
            {conn.startingConn.connEvents.map(createEvent)}
            {conn.acceptingConn.connEvents.map(createEvent)}
        </>
    );
}
