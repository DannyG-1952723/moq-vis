interface CodeBlockProps {
    children: string;
}

export default function CodeBlock({ children }: CodeBlockProps) {
    return (
        <div className="bg-gray-50 rounded-lg dark:bg-gray-700 p-4">
            <pre className="overflow-auto text-sm text-gray-500 dark:text-gray-400 whitespace-pre">
                <code className="font-mono">{children}</code>
            </pre>
        </div>
    );
}
