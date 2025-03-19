import * as d3 from "d3";
import { FileEvent } from "@/model/LogFile";

interface EventProps {
    event: FileEvent;
    eventNum: number;
    blockSize: number;
    xScale: d3.ScalePoint<string>;
    yScale: d3.ScaleLinear<number, number, never>;
}

export default function Event({ event, eventNum, blockSize, xScale, yScale }: EventProps) {
    const shortName = event.logFileEvent.name.substring(event.logFileEvent.name.lastIndexOf(":") + 1);

    return (
        <g transform={`translate(${xScale(event.fileName)}, ${yScale(eventNum)})`}>
            <rect y={-15} width={blockSize} height={blockSize} rx={5} />
            <line x1={15} x2={40} stroke="black" strokeWidth="5" strokeLinecap="round" />
            <text x={45} y="4" style={{fill: "black"}}>{shortName}</text>
        </g>
    );
}
