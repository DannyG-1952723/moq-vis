import { ChangeEventHandler } from "react";

interface FileInputProps {
    handleImport: ChangeEventHandler;
}

export default function FileInput({ handleImport }: FileInputProps) {
    return (
        <>
            <label htmlFor="files" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Import files
            </label>
            <input type="file" id="files" name="files" accept=".sqlog" multiple onChange={handleImport} className="block text-sm mb-2 text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 mr-4 file:px-4 file:py-2.5 file:mr-4 file:text-white file:font-semibold hover:file:bg-gray-700 file:bg-gray-800 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400" />
        </>
    );
}
