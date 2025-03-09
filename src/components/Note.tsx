import { ReactNode } from "react";

interface NoteProps {
    children: ReactNode;
}

export default function Note({ children }: NoteProps) {
    return (
        <p className="text-sm my-1 text-gray-700">{children}</p>
    );
}
