// TODO: Add styling

interface InlineCodeProps {
    children: string;
}

export default function InlineCode({ children }: InlineCodeProps) {
    return <code>{children}</code>;
}
