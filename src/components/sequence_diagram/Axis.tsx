interface AxisProps {
    xPos: number;
    yPos: number;
    height: number;
}

export default function Axis({ xPos, yPos, height }: AxisProps) {
    return <line x1={xPos} y1={yPos} x2={xPos} y2={yPos + height} stroke="black" strokeWidth={6} strokeLinecap="round" />;
}
