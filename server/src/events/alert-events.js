import { EventEmitter } from "node:events";

export const alertEvents = new EventEmitter();
alertEvents.setMaxListeners(25);

