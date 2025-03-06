import { MouseEventHandler, ReactNode } from "react";

type ButtonType = "button" | "submit" | "reset" | undefined;

interface ButtonProps {
    children: ReactNode;
    type: ButtonType;
    // TODO: Add type
    handleClick;
}

export default function Button({ children, type, handleClick }: ButtonProps) {
    return (
        <button type={type} onClick={handleClick} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer">
            {children}
        </button>
    );
}