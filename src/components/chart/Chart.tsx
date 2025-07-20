import { Connection } from "@/model/Network";
import * as d3 from "d3";
import AxisBottom from "./AxisBottom";
import AxisLeft from "./AxisLeft";

const MARGIN = { top: 40, bottom: 50, left: 65, right: 20 };
const WIDTH = 624;
const HEIGHT = 351;
const INNER_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const INNER_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;

interface ChartProps {
    connection: Connection;
}

export default function Chart({ connection }: ChartProps) {
    const timestamps = connection.messageEvents.map(event => event.createdEvent.event.time);
    const minTimestamp = d3.min(timestamps) ?? 0;

    const normalizedTimestamps = connection.messageEvents.map(event => event.createdEvent.event.time - minTimestamp);
    const latencies = connection.messageEvents.map(event => event.parsedEvent.event.time - event.createdEvent.event.time);

    const xScale = d3.scaleLinear()
        .domain([d3.min(normalizedTimestamps)!, d3.max(normalizedTimestamps)!])
        .range([0, INNER_WIDTH])
        .nice();

    const yScale = d3.scaleLinear()
        .domain([d3.max(latencies)!, d3.min(latencies)!])
        .range([0, INNER_HEIGHT])
        .nice();

    const lines = [];

    for (let i = 1; i < latencies.length; ++i) {
        const x1 = xScale(normalizedTimestamps[i - 1]);
        const y1 = yScale(latencies[i - 1]);
        const x2 = xScale(normalizedTimestamps[i]);
        const y2 = yScale(latencies[i]);

        lines.push(<line className="stroke-blue-700" x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={2} />)
    }

    return (
        <svg className="flex-shrink-0 mb-5" width={WIDTH} height={HEIGHT}>
            <text fontSize="1.2em" x={WIDTH / 2} y={30} textAnchor="middle">{`Connection ${connection.startingConn.fileName} \u2013 ${connection.acceptingConn.fileName}`}</text>
            <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
                <AxisBottom xScale={xScale} width={INNER_WIDTH} height={INNER_HEIGHT} />
                <AxisLeft yScale={yScale} height={INNER_HEIGHT} />
                {lines}
                {latencies.map((latency, i) =>
                    <circle className="fill-blue-700" cx={xScale(normalizedTimestamps[i])} cy={yScale(latency)} r={3}>
                        <title>{`${latency} ms`}</title>
                    </circle>
                )}
            </g>
        </svg>
    );
}
