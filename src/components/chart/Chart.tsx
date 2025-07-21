import { Connection } from "@/model/Network";
import * as d3 from "d3";
import AxisBottom from "./AxisBottom";
import AxisLeft from "./AxisLeft";
import Marks from "./Marks";

const MARGIN = { top: 40, bottom: 50, left: 65, right: 20 };
const WIDTH = 624;
const HEIGHT = 351;
const INNER_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const INNER_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;

// At least one of the connections is not undefined
interface ChartProps {
    quicConnection?: Connection;
    moqConnection?: Connection;
}

export default function Chart({ quicConnection, moqConnection }: ChartProps) {
    const quicTimestamps = quicConnection?.messageEvents.map(event => event.createdEvent.event.time) ?? [];
    const moqTimestamps = moqConnection?.messageEvents.map(event => event.createdEvent.event.time) ?? [];

    const minTimestamp = d3.min([d3.min(quicTimestamps) ?? Infinity, d3.min(moqTimestamps) ?? Infinity])!;

    const normalizedQuicTimestamps = quicConnection?.messageEvents.map(event => event.createdEvent.event.time - minTimestamp) ?? [];
    const normalizedMoqTimestamps = moqConnection?.messageEvents.map(event => event.createdEvent.event.time - minTimestamp) ?? [];

    const quicLatencies = quicConnection?.messageEvents.map(event => event.parsedEvent.event.time - event.createdEvent.event.time) ?? [];
    const moqLatencies = moqConnection?.messageEvents.map(event => event.parsedEvent.event.time - event.createdEvent.event.time) ?? [];

    const minNormalizedTimestamp = d3.min([d3.min(normalizedQuicTimestamps) ?? Infinity, d3.min(normalizedMoqTimestamps) ?? Infinity])!;
    const maxNormalizedTimestamp = d3.max([d3.max(normalizedQuicTimestamps) ?? -Infinity, d3.max(normalizedMoqTimestamps) ?? -Infinity])!;

    const minLatency = d3.min([d3.min(quicLatencies) ?? Infinity, d3.min(moqLatencies) ?? Infinity])!;
    const maxLatency = d3.max([d3.max(quicLatencies) ?? -Infinity, d3.max(moqLatencies) ?? -Infinity])!;

    const xScale = d3.scaleLinear()
        .domain([minNormalizedTimestamp, maxNormalizedTimestamp])
        .range([0, INNER_WIDTH])
        .nice();

    const yScale = d3.scaleLinear()
        .domain([maxLatency, minLatency])
        .range([0, INNER_HEIGHT])
        .nice();

    const startingConnFileName = quicConnection === undefined ? moqConnection!.startingConn.fileName : quicConnection.startingConn.fileName;
    const acceptingConnFileName = quicConnection === undefined ? moqConnection!.acceptingConn.fileName : quicConnection.acceptingConn.fileName;

    return (
        <svg className="flex-shrink-0 mb-5" width={WIDTH} height={HEIGHT}>
            <text fontSize="1.2em" x={WIDTH / 2} y={30} textAnchor="middle">{`Connection ${startingConnFileName} \u2013 ${acceptingConnFileName}`}</text>
            <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
                <AxisBottom xScale={xScale} width={INNER_WIDTH} height={INNER_HEIGHT} />
                <AxisLeft yScale={yScale} height={INNER_HEIGHT} />
                <Marks latencies={quicLatencies} timestamps={normalizedQuicTimestamps} xScale={xScale} yScale={yScale} connectionType="quic" />
                <Marks latencies={moqLatencies} timestamps={normalizedMoqTimestamps} xScale={xScale} yScale={yScale} connectionType="moq" />
            </g>
        </svg>
    );
}
