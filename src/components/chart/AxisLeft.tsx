import TickLeft from "./TickLeft";

interface AxisLeftProps {
    yScale: d3.ScaleLinear<number, number, never>;
    height: number;
}

export default function AxisLeft({ yScale, height }: AxisLeftProps) {
    const textMiddleX = -40;
    const textMiddleY = height / 2;

    return (
        <g className="axis-left">
            {yScale.ticks().map(tickValue => <TickLeft key={tickValue} value={tickValue} position={yScale(tickValue)} />)}
            <text transform={`rotate(-90, ${textMiddleX}, ${textMiddleY})`} fontSize="1.1em" x={textMiddleX} y={textMiddleY} textAnchor="middle">Latency (ms)</text>
        </g>
    );
}
