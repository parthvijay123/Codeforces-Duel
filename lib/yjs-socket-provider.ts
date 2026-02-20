import * as Y from 'yjs';
import { Socket } from 'socket.io-client';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';

/**
 * Lightweight Yjs provider that syncs document updates via Socket.IO.
 * The server is a pure relay — all CRDT logic lives in Yjs.
 */
export class YjsSocketProvider {
    doc: Y.Doc;
    awareness: Awareness;
    socket: Socket;
    roomId: string;
    private _synced = false;
    private _updateHandler: (update: Uint8Array, origin: any) => void;
    private _awarenessHandler: (changes: any) => void;

    constructor(doc: Y.Doc, socket: Socket, roomId: string, userInfo?: { name: string; color: string }) {
        this.doc = doc;
        this.socket = socket;
        this.roomId = roomId;
        this.awareness = new Awareness(doc);

        // Set local awareness state (cursor info)
        if (userInfo) {
            this.awareness.setLocalStateField('user', userInfo);
        }

        // --- Outbound: local doc changes → server ---
        this._updateHandler = (update: Uint8Array, origin: any) => {
            if (origin !== 'remote') {
                this.socket.emit('yjs_update', {
                    roomId: this.roomId,
                    update: Array.from(update), // Convert to regular array for JSON serialization
                });
            }
        };
        this.doc.on('update', this._updateHandler);

        // --- Outbound: local awareness changes → server ---
        this._awarenessHandler = ({ added, updated, removed }: any) => {
            const changedClients = added.concat(updated).concat(removed);
            const awarenessUpdate = encodeAwarenessUpdate(this.awareness, changedClients);
            this.socket.emit('yjs_awareness', {
                roomId: this.roomId,
                update: Array.from(awarenessUpdate),
            });
        };
        this.awareness.on('update', this._awarenessHandler);

        // --- Inbound: server → local doc ---
        this.socket.on('yjs_update', (data: { update: number[] }) => {
            const update = new Uint8Array(data.update);
            Y.applyUpdate(this.doc, update, 'remote');
            this._synced = true;
        });

        // --- Inbound: server → local awareness ---
        this.socket.on('yjs_awareness', (data: { update: number[] }) => {
            const update = new Uint8Array(data.update);
            applyAwarenessUpdate(this.awareness, update, 'remote');
        });

        // Join the Yjs room on the server
        this.socket.emit('yjs_join', { roomId: this.roomId });
    }

    get synced() {
        return this._synced;
    }

    destroy() {
        this.doc.off('update', this._updateHandler);
        this.awareness.off('update', this._awarenessHandler);
        this.socket.off('yjs_update');
        this.socket.off('yjs_awareness');
        this.awareness.destroy();
    }
}
