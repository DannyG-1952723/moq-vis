import * as d3 from "d3";
import { LogFile, LogFileEvent } from "./LogFile";

function eventsToConnectionEvents(eventList: LogFileEvent[], fileName: string): ConnectionEvent[] {
    return eventList.map(event => new ConnectionEvent(event, 0, fileName));
}

function getEventsFromFiles(events: ConnectionEvent[], logFile: LogFile): ConnectionEvent[] {
    return events.concat(eventsToConnectionEvents(logFile.events, logFile.name));
}

export class Network {
    nodes: string[];
    connections: Connection[];

    constructor(logFiles: LogFile[]) {
        const allEvents = d3.reduce(logFiles, getEventsFromFiles, []).sort((event1, event2) => event1.event.time - event2.event.time);

        for (let i = 0; i < allEvents.length; i++) {
            allEvents[i].eventNum = i;
        }

        const groupedEvents = Object.groupBy(allEvents, event => event.fileName);

        const connectionNodes = this.createConnectionNodes(logFiles, groupedEvents);
        
        this.nodes = logFiles.map(logFile => logFile.name);
        this.connections = this.createConnections(connectionNodes);
    }

    createConnectionNodes(logFiles: LogFile[], groupedEvents: Partial<Record<string, ConnectionEvent[]>>): Record<string, ConnectionNode> {
        const connectionNodes: Record<string, ConnectionNode> = {};

        logFiles.forEach(file => {
            const events = groupedEvents[file.name];

            if (!events) {
                return;
            }

            events.forEach(event => {
                if (!event.event.group_id) {
                    return;
                }

                const key = `${file.name}_${event.event.group_id}`;

                if (key in connectionNodes) {
                    connectionNodes[key].addEvent(event);
                }
                else {
                    connectionNodes[key] = new ConnectionNode(file.name, event.event.group_id, [event]);
                }
            });
        });

        return connectionNodes;
    }

    createConnections(connectionNodes: Record<string, ConnectionNode>): Connection[] {
        const connections: Connection[] = [];
        const connectionNodeList = Object.entries(connectionNodes);

        for (let i = 0; i < connectionNodeList.length; i++) {
            const key1 = connectionNodeList[i][0];
            const connNode1 = connectionNodeList[i][1];

            const connId1 = key1.substring(key1.lastIndexOf("_") + 1);

            for (let j = i + 1; j < connectionNodeList.length; j++) {
                const key2 = connectionNodeList[j][0];
                const connNode2 = connectionNodeList[j][1];

                const connId2 = key2.substring(key2.lastIndexOf("_") + 1);

                if (connId1 === connId2) {
                    connections.push(new Connection(connNode1, connNode2));
                }
            }
        }

        return connections;
    }
}

class Connection {
    connectionNode1: ConnectionNode;
    connectionNode2: ConnectionNode;

    constructor(connectionNode1: ConnectionNode, connectionNode2: ConnectionNode) {
        this.connectionNode1 = connectionNode1;
        this.connectionNode2 = connectionNode2;
    }
}

class ConnectionNode {
    fileName: string
    connectionId: string
    connectionEvents: ConnectionEvent[];

    constructor(fileName: string, connectionId: string, connectionEvents: ConnectionEvent[] = []) {
        this.fileName = fileName;
        this.connectionId = connectionId;
        this.connectionEvents = connectionEvents;
    }

    addEvent(event: ConnectionEvent) {
        this.connectionEvents.push(event);
    }
}

class ConnectionEvent {
    event: LogFileEvent;
    eventNum: number;
    fileName: string;

    constructor(event: LogFileEvent, eventNum: number, fileName: string) {
        this.event = event;
        this.eventNum = eventNum;
        this.fileName = fileName;
    }
}
