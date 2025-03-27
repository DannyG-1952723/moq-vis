import * as d3 from "d3";
import { ConnectionEvent } from "@/model/Network";
import { BLOCK_SIZE } from "@/model/util";

interface EventProps {
    event: ConnectionEvent;
    xScale: d3.ScalePoint<string>;
    yScale: d3.ScaleLinear<number, number, never>;
}

export default function Event({ event, xScale, yScale }: EventProps) {
    const shortName = event.event.name.substring(event.event.name.lastIndexOf(":") + 1);

    return (
        <g transform={`translate(${xScale(event.fileName)}, ${yScale(event.eventNum)})`}>
            <rect y={-15} width={BLOCK_SIZE} height={BLOCK_SIZE} rx={5} />
            <line x1={15} x2={40} stroke="black" strokeWidth="5" strokeLinecap="round" />
            <text x={45} y="4" style={{fill: "black"}}>{shortName}</text>
        </g>
    );
}
