import { TICK_MARK_LENGTH } from "@/model/util";

interface AxisBottomProps {
    xScale: d3.ScaleLinear<number, number, never>;
    width: number;
    height: number;
}

export default function AxisBottom({ xScale, width, height }: AxisBottomProps) {
    return (
        <g className="axis-bottom">
            {xScale.ticks().map(tickValue =>
                <g key={tickValue} transform={`translate(${xScale(tickValue)}, 0)`}>
                    <line y1={height - TICK_MARK_LENGTH / 2} y2={height + TICK_MARK_LENGTH / 2} stroke="black" />
                    <text className="font-mono text-[14px]" textAnchor="middle" y={height + 3} dy="1em">{tickValue / 1000}</text>
                </g>
            )}
            <text fontSize="1.1em" x={width / 2} y={height + 42} textAnchor="middle">Time since connection start (s)</text>
        </g>
    );
}
