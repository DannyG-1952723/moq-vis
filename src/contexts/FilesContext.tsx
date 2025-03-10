"use client";

import { LogFile } from "@/model/LogFile";
import { ActionDispatch, createContext, ReactNode, useContext, useReducer } from "react";

export const FilesContext = createContext<LogFile[]>([]);
export const FilesDispatchContext = createContext<ActionDispatch<[action: FileAction]> | null>(null);

interface FilesProviderProps {
    children: ReactNode;
}

export function FilesProvider({ children }: FilesProviderProps) {
    const [files, dispatch] = useReducer(filesReducer, []);

    return (
        <FilesContext.Provider value={files}>
            <FilesDispatchContext.Provider value={dispatch}>
                {children}
            </FilesDispatchContext.Provider>
        </FilesContext.Provider>
    );
}

export function useFiles() {
    return useContext(FilesContext);
}

export function useFilesDispatch() {
    return useContext(FilesDispatchContext);
}

export class FileAction {
    type: ActionType;
    files: LogFile[];

    constructor(type: ActionType, files: LogFile[]) {
        this.type = type;
        this.files = files;
    }
}

export enum ActionType {
    Add,
    Delete
}

function filesReducer(files: LogFile[], action: FileAction) {
    switch (action.type) {
        case ActionType.Add:
            return [...files, ...action.files];
        case ActionType.Delete: {
            if (action.files.length !== 1) {
                throw new Error("Provide a single file to delete");
            }

            return files.filter(file => file.name !== action.files[0].name);
        }
        default:
            return files;
    }
}
