"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
    const pathName = usePathname();

    const activeLinkStyling = "block p-0 rounded-sm bg-transparent text-blue-700 dark:text-blue-500 dark:bg-transparent";
    const inactiveLinkStyling = "block p-0 text-gray-900 rounded-sm hover:bg-transparent border-0 hover:text-blue-700 dark:hover:text-blue-500 dark:hover:text-white dark:hover:bg-transparent";

    const links = [
        { name: "Files", path: "/" },
        { name: "Sequence", path: "/sequence" },
        { name: "Charts", path: "/charts" }
    ];

    const linkElements = links.map((link) =>
        <li key={link.path}>
            <Link href={link.path} className={pathName === link.path ? activeLinkStyling : inactiveLinkStyling}>
                {link.name}
            </Link>
        </li>
    );

    return (
        <nav className="border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
            <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
                <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">moq-vis: Media over QUIC Visualizations</span>
                <div className="block w-auto">
                <ul className="flex font-medium rounded-lg space-x-8 flex-row mt-0 border-0 bg-transparent dark:bg-transparent dark:border-gray-700">
                    {linkElements}
                </ul>
                </div>
            </div>
        </nav>
    );
}
