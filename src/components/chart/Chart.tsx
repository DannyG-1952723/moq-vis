import { Connection } from "@/model/Network";
import * as d3 from "d3";
import AxisBottom from "./AxisBottom";
import AxisLeft from "./AxisLeft";
import Marks from "./Marks";
import { useEffect, useRef, useState } from "react";

const MARGIN = { top: 60, bottom: 50, left: 65, right: 50 };
const WIDTH = 624;
const HEIGHT = 351;
const INNER_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const INNER_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;

// At least one of the connections is not undefined
interface ChartProps {
    showQuicData: boolean;
    showMoqData: boolean;
    quicConnection?: Connection;
    moqConnection?: Connection;
}

export default function Chart({ showQuicData, showMoqData, quicConnection, moqConnection }: ChartProps) {
    const chartRef = useRef<SVGGElement>(null);
    const popupContainerRef = useRef<SVGGElement>(null);
    const [currentZoomState, setCurrentZoomState] = useState<d3.ZoomTransform>();

    useEffect(() => {
        if (!chartRef) {
            return;
        }

        const chart = d3.select<SVGGElement, unknown>(chartRef.current!);

        const zoomBehavior = d3.zoom<SVGGElement, unknown>()
            .scaleExtent([1, 32])
            .translateExtent([[0, 0], [INNER_WIDTH, INNER_HEIGHT]])
            .extent([[0, 0], [INNER_WIDTH, INNER_HEIGHT]])
            .on("zoom", () => {
                const zoomState = d3.zoomTransform(chart.node()!);
                setCurrentZoomState(zoomState);
            });

        chart.call(zoomBehavior);
    }, [currentZoomState]);

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
    
    if (currentZoomState) {
        xScale.domain(currentZoomState.rescaleX(xScale).domain());
    }

    const yScale = d3.scaleLinear()
        .domain([minLatency, maxLatency])
        .range([INNER_HEIGHT, 0])
        .nice();

    const startingConnFileName = quicConnection === undefined ? moqConnection!.startingConn.fileName : quicConnection.startingConn.fileName;
    const acceptingConnFileName = quicConnection === undefined ? moqConnection!.acceptingConn.fileName : quicConnection.acceptingConn.fileName;

    // Calculates everything with both connections in mind in order to not change the scales
    const quicMarks = showQuicData ?
        <Marks latencies={quicLatencies} timestamps={normalizedQuicTimestamps} xScale={xScale} yScale={yScale} connectionType="quic" popupContainerRef={popupContainerRef} />
        :
        <></>;
    const moqMarks = showMoqData ?
        <Marks latencies={moqLatencies} timestamps={normalizedMoqTimestamps} xScale={xScale} yScale={yScale} connectionType="moq" popupContainerRef={popupContainerRef} />
        :
        <></>;

    return (
        <svg className="flex-shrink-0 mb-5" width={WIDTH} height={HEIGHT}>
            <defs>
                {/* Prevents the chart to go out of bounds when zooming and panning (covers the left axis otherwise) */}
                <clipPath id="chart-clip">
                    {/* Make the clip path a bit bigger to not cut off parts of the points */}
                    <rect x={-5} y={-5} width={INNER_WIDTH + 10} height={INNER_HEIGHT + 10} />
                </clipPath>
            </defs>

            <text fontSize="1.2em" x={WIDTH / 2} y={30} textAnchor="middle">{`Connection ${startingConnFileName} \u2013 ${acceptingConnFileName}`}</text>

            <g ref={chartRef} transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
                {/* Needed so zooming and dragging works on the background and not only the visible elements */}
                <rect width={INNER_WIDTH} height={INNER_HEIGHT} fill="transparent" />

                <g clipPath="url(#chart-clip)">
                    {quicMarks}
                    {moqMarks}
                </g>

                <AxisLeft yScale={yScale} height={INNER_HEIGHT} />
                <AxisBottom xScale={xScale} width={INNER_WIDTH} height={INNER_HEIGHT} />

                <g ref={popupContainerRef} className="popup-container" />
            </g>
        </svg>
    );
}
