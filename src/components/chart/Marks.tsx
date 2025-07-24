import { ConnectionType } from "@/model/Network";
import Mark from "./Mark";
import { RefObject } from "react";

interface MarksProps {
    latencies: number[];
    timestamps: number[];
    xScale: d3.ScaleLinear<number, number, never>;
    yScale: d3.ScaleLinear<number, number, never>;
    connectionType: ConnectionType;
    popupContainerRef: RefObject<SVGGElement | null>;
}

const QUIC_CLASS_NAME = "stroke-green-700";
const MOQ_CLASS_NAME = "stroke-blue-700";

export default function Marks({ latencies, timestamps, xScale, yScale, connectionType, popupContainerRef }: MarksProps) {
    const className = connectionType === "quic" ? QUIC_CLASS_NAME : MOQ_CLASS_NAME;

    const lines = [];
    
    for (let i = 1; i < latencies.length; ++i) {
        const x1 = xScale(timestamps[i - 1]);
        const y1 = yScale(latencies[i - 1]);
        const x2 = xScale(timestamps[i]);
        const y2 = yScale(latencies[i]);

        lines.push(<line className={className} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={2} />)
    }

    return (
        <g className={connectionType === "quic" ? "quic-marks" : "moq-marks"}>
            {lines}
            {latencies.map((latency, i) =>
                <Mark key={i} x={xScale(timestamps[i])} y={yScale(latency)} latency={latency} timestamp={timestamps[i]} connectionType={connectionType} popupContainerRef={popupContainerRef} />
            )}
        </g>
    );
}
