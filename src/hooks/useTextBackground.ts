import { DependencyList, RefObject, useEffect, useRef } from "react";

export function useTextBackground(dependencies: DependencyList, textAngle: number = 0, textMiddleX: number = 0, textMiddleY: number = 0, textBgPaddingX: number = 6, textBgPaddingY: number = 4): [RefObject<SVGTextElement | null>, RefObject<SVGRectElement | null>] {
    const textRef = useRef<SVGTextElement>(null);
    const textBgRef = useRef<SVGRectElement>(null);

    useEffect(() => {
        if (!textRef.current || !textBgRef.current) {
            return;
        }

        const boundingBox = textRef.current.getBBox();

        textRef.current.setAttribute("transform", `rotate(${textAngle}, ${textMiddleX}, ${textMiddleY})`);

        textBgRef.current.setAttribute("x", `${boundingBox.x - textBgPaddingX}`);
        textBgRef.current.setAttribute("y", `${boundingBox.y - textBgPaddingY}`);
        textBgRef.current.setAttribute("width", `${boundingBox.width + 2 * textBgPaddingX}`);
        textBgRef.current.setAttribute("height", `${boundingBox.height + 2 * textBgPaddingY}`);
        textBgRef.current.setAttribute("transform", `rotate(${textAngle}, ${textMiddleX}, ${textMiddleY})`);
    }, dependencies);

    return [textRef, textBgRef];
}
