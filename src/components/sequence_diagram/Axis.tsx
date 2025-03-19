interface AxisProps {
    xPos: number;
    yPos: number;
    height: number;
    fileName: string;
}

export default function Axis({ xPos, yPos, height, fileName }: AxisProps) {
    return (
        <g transform={`translate(${xPos}, ${yPos})`}>
            <text style={{ textAnchor: "middle" }} y={-15}>{fileName}</text>
            <line y2={height} stroke="black" strokeWidth={6} strokeLinecap="round" />
        </g>
    );
}
