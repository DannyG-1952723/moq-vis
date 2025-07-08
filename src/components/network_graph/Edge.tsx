const STROKE_WIDTH = 5;

interface EdgeProps {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export default function Edge({x1, y1, x2, y2}: EdgeProps) {
    return <line className="edge" x1={x1} y1={y1} x2={x2} y2={y2} stroke="black" strokeWidth={STROKE_WIDTH} strokeLinecap="round" />;
}
