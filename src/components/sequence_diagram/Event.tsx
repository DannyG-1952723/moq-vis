import * as d3 from "d3";
import { ConnectionEvent } from "@/model/Network";

interface EventProps {
    event: ConnectionEvent;
    blockSize: number;
    xScale: d3.ScalePoint<string>;
    yScale: d3.ScaleLinear<number, number, never>;
}

export default function Event({ event, blockSize, xScale, yScale }: EventProps) {
    const shortName = event.event.name.substring(event.event.name.lastIndexOf(":") + 1);

    return (
        <g transform={`translate(${xScale(event.fileName)}, ${yScale(event.eventNum)})`}>
            <rect y={-15} width={blockSize} height={blockSize} rx={5} />
            <line x1={15} x2={40} stroke="black" strokeWidth="5" strokeLinecap="round" />
            <text x={45} y="4" style={{fill: "black"}}>{shortName}</text>
        </g>
    );
}
