// TODO: Add styling

interface InlineCodeProps {
    children: string;
}

export default function InlineCode({ children }: InlineCodeProps) {
    return <code className="font-mono text-sm border border-gray-200 rounded-md text-gray-500 bg-gray-50 p-0.5">{children}</code>;
}
