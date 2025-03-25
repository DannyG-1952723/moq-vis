interface AxisProps {
    xPos: number;
    yPos: number;
    height: number;
    fileName: string;
}

export default function Axis({ xPos, yPos, height, fileName }: AxisProps) {
    return (
        <g transform={`translate(${xPos}, ${yPos})`}>
            <text style={{ textAnchor: "middle" }} y={-15} className="fill-gray-500">{fileName}</text>
            <line y2={height} strokeWidth={6} strokeLinecap="round" className="stroke-gray-400" />
        </g>
    );
}
