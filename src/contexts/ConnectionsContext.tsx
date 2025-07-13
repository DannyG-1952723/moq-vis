"use client";

import { Connection } from "@/model/Network";
import { ActionDispatch, createContext, ReactNode, useContext, useReducer } from "react";

export const ConnectionsContext = createContext<Connection[]>([]);
export const ConnectionsDispatchContext = createContext<ActionDispatch<[action: ConnectionAction]> | null>(null);

interface ConnectionProviderProps {
    children: ReactNode;
}

export function ConnectionProvider({ children }: ConnectionProviderProps) {
    const [connections, dispatch] = useReducer(connectionsReducer, []);

    return (
        <ConnectionsContext.Provider value={connections}>
            <ConnectionsDispatchContext.Provider value={dispatch}>
                {children}
            </ConnectionsDispatchContext.Provider>
        </ConnectionsContext.Provider>
    );
}

export function useConnections() {
    return useContext(ConnectionsContext);
}

export function useConnectionsDispatch() {
    return useContext(ConnectionsDispatchContext);
}

export class ConnectionAction {
    type: ActionType;
    connections: Connection[];

    constructor(type: ActionType, connections: Connection[]) {
        this.type = type;
        this.connections = connections;
    }
}

export enum ActionType {
    Add,
    Delete,
}

function connectionsReducer(connections: Connection[], action: ConnectionAction) {
    switch (action.type) {
        case ActionType.Add:
            return [...connections, ...action.connections];
        case ActionType.Delete:
            return connections.filter(conn => !action.connections.includes(conn));
        default:
            return connections;
    }
}
