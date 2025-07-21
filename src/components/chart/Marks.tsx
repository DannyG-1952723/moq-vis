import { ConnectionType } from "@/model/Network";

interface MarksProps {
    latencies: number[];
    timestamps: number[];
    xScale: d3.ScaleLinear<number, number, never>;
    yScale: d3.ScaleLinear<number, number, never>;
    connectionType: ConnectionType;
}

const QUIC_CLASS_NAME_LINES = "stroke-green-700";
const MOQ_CLASS_NAME_LINES = "stroke-blue-700";
const QUIC_CLASS_NAME_CIRCLES = "fill-green-700";
const MOQ_CLASS_NAME_CIRCLES = "fill-blue-700";

export default function Marks({ latencies, timestamps, xScale, yScale, connectionType }: MarksProps) {
    const classNameLines = connectionType === "quic" ? QUIC_CLASS_NAME_LINES : MOQ_CLASS_NAME_LINES;
    const classNameCircles = connectionType === "quic" ? QUIC_CLASS_NAME_CIRCLES : MOQ_CLASS_NAME_CIRCLES;

    const lines = [];
    
    for (let i = 1; i < latencies.length; ++i) {
        const x1 = xScale(timestamps[i - 1]);
        const y1 = yScale(latencies[i - 1]);
        const x2 = xScale(timestamps[i]);
        const y2 = yScale(latencies[i]);

        lines.push(<line className={classNameLines} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={2} />)
    }

    return (
        <g className={connectionType === "quic" ? "quic-marks" : "moq-marks"}>
            {lines}
            {latencies.map((latency, i) =>
                <circle className={classNameCircles} cx={xScale(timestamps[i])} cy={yScale(latency)} r={3}>
                    <title>{`${latency} ms`}</title>
                </circle>
            )}
        </g>
    );
}
