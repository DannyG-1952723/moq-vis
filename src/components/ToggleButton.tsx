import { ChangeEventHandler, MouseEvent } from "react";

interface ToggleButtonProps {
    label: string;
    checked: boolean;
    onChange: ChangeEventHandler<HTMLInputElement>;
}

export default function ToggleButton({ label, checked, onChange }: ToggleButtonProps) {
    return (
        <label onClick={(event: MouseEvent<HTMLLabelElement>) => event.stopPropagation()} className="inline-flex items-center cursor-pointer">
            <input onChange={onChange} type="checkbox" value="" checked={checked} className="sr-only peer" />
            <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600" />
            <span className="text-md text-gray-900 dark:text-white ml-1.5">{label}</span>
        </label>
    );
}
