import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const logsDirectory = path.join(process.cwd(), 'public', 'demo_logs');
        const files = fs.readdirSync(logsDirectory);

        const logs = files.map((file) => {
            const filePath = path.join(logsDirectory, file);
            const content = fs.readFileSync(filePath, "utf-8");

            console.log(content);

            return { name: file, content: content };
        })

        return NextResponse.json({ logs }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read files' }, { status: 500 });
    }
}
