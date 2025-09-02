"use strict";
// utils.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeId = sanitizeId;
exports.ensureTranslatedName = ensureTranslatedName;
exports.createStructuredWritableState = createStructuredWritableState;
exports.createDevice = createDevice;
exports.createChannel = createChannel;
exports.createFolder = createFolder;
exports.createWritableState = createWritableState;
exports.createState = createState;
/**
 * Sanitize a string to create a valid ID.
 *
 * @param name The input string to sanitize.
 * @returns The sanitized string.
 */
function sanitizeId(name) {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\d-_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase();
}
/**
 * Ensures that a translated name is returned in a consistent format.
 *
 * @param name The input name to ensure.
 * @param fallback A fallback name to use if the input is not valid.
 * @returns The ensured translated name.
 */
function ensureTranslatedName(name, fallback) {
    if (!name && fallback) {
        return fallback;
    }
    if (typeof name === 'string') {
        return name;
    }
    if (typeof name === 'object') {
        // Stelle sicher, dass 'en' gesetzt ist – ggf. mit fallback
        return {
            ...name,
            en: name.en ?? fallback ?? 'unknown',
        };
    }
    return fallback ?? 'unknown';
}
/**
 * 🔧 Creates a structured writable state in the ioBroker.
 *
 * @param adapter The ioBroker adapter instance.
 * @param deviceId The ID of the device.
 * @param stateId The ID of the state.
 * @param value The value to set for the state.
 * @param options Options for creating the structured writable state.
 */
async function createStructuredWritableState(adapter, deviceId, stateId, value, options) {
    const { deviceName, channelId, channelName, stateName, role = 'state', type = typeof value, unit, q, } = options ?? {};
    const devicePath = deviceId;
    const channelPath = channelId ? `${devicePath}.${channelId}` : undefined;
    const statePath = channelPath ? `${channelPath}.${stateId}` : `${devicePath}.${stateId}`;
    // Device
    await adapter.setObjectNotExistsAsync(devicePath, {
        type: 'device',
        common: {
            name: ensureTranslatedName(deviceName, deviceId),
        },
        native: {},
    });
    // Channel (optional)
    if (channelPath) {
        await adapter.setObjectNotExistsAsync(channelPath, {
            type: 'channel',
            common: {
                name: ensureTranslatedName(channelName, channelId), //!
            },
            native: {},
        });
    }
    // State (writeable)
    await adapter.setObjectNotExistsAsync(statePath, {
        type: 'state',
        common: {
            name: ensureTranslatedName(stateName, stateId),
            role,
            type,
            unit,
            read: true,
            write: true,
        },
        native: {},
    });
    //await adapter.setState(statePath, { val: value, ack: false, q: q !== undefined ? q : undefined } as ioBroker.State);
    const state = {
        val: value,
        ack: false,
    };
    if (q !== undefined) {
        state.q = q;
    }
    await adapter.setState(statePath, state);
}
/**
 * 🔧 Creates a device in the ioBroker.
 *
 * @param adapter The ioBroker adapter instance.
 * @param deviceId The ID of the device.
 * @param name The name of the device.
 * @returns The ID of the created device.
 */
async function createDevice(adapter, deviceId, name) {
    const id = sanitizeId(deviceId);
    await adapter.setObjectNotExistsAsync(id, {
        type: 'device',
        common: {
            name: ensureTranslatedName(name, id),
        },
        native: {},
    });
    return id;
}
/**
 * 🔧 Creates a channel in the ioBroker.
 *
 * @param adapter The ioBroker adapter instance.
 * @param deviceId The ID of the device.
 * @param channelId The ID of the channel.
 * @param name The name of the channel.
 * @returns The ID of the created channel.
 */
async function createChannel(adapter, deviceId, channelId, name) {
    const devId = sanitizeId(deviceId);
    const chId = sanitizeId(channelId);
    const fullId = `${devId}.${chId}`;
    await adapter.setObjectNotExistsAsync(fullId, {
        type: 'channel',
        common: {
            name: ensureTranslatedName(name, chId),
        },
        native: {},
    });
    return fullId;
}
/**
 * 🔧 Creates a folder in the ioBroker.
 *
 * @param adapter The ioBroker adapter instance.
 * @param deviceId The ID of the device.
 * @param folderId The ID of the folder.
 * @param name The name of the folder.
 * @returns The ID of the created folder.
 */
async function createFolder(adapter, deviceId, folderId, name) {
    const devId = sanitizeId(deviceId);
    const fId = sanitizeId(folderId);
    const fullId = `${devId}.${fId}`;
    await adapter.setObjectNotExistsAsync(fullId, {
        type: 'folder',
        common: {
            name: ensureTranslatedName(name, fId),
        },
        native: {},
    });
    return fullId;
}
/**
 * 🔧 Creates a writable state in the ioBroker.
 *
 * @param adapter The ioBroker adapter instance.
 * @param fullPath The full path of the state (e.g., "device.channel.state").
 * @param stateId The ID of the state.
 * @param value The initial value of the state.
 * @param options Options for creating the writable state.
 * @param options.name optional name for the state
 * @param options.role optional role for the state
 * @param options.type optional type for the state
 * @param options.unit optional unit for the state
 * @param options.q optional quality for the state
 */
async function createWritableState(adapter, fullPath, //z.B. "device.channel.state"
stateId, value, options) {
    const { name, role = 'state', type = typeof value, unit, q } = options ?? {};
    const stId = sanitizeId(stateId);
    const fullStatePath = `${fullPath}.${stId}`;
    await adapter.setObjectNotExistsAsync(fullStatePath, {
        type: 'state',
        common: {
            name: ensureTranslatedName(name, stId),
            role,
            type,
            unit,
            read: true,
            write: true,
        },
        native: {},
    });
    const state = {
        val: value,
        ack: false,
    };
    if (q !== undefined) {
        state.q = q;
    }
    await adapter.setState(fullStatePath, state);
}
/**
 * 🔧 Creates a state in the ioBroker.
 *
 * @param adapter The ioBroker adapter instance.
 * @param fullPath The full path of the state (e.g., "device.channel.state").
 * @param stateId The ID of the state.
 * @param value The initial value of the state.
 * @param options Options for creating the state.
 * @param options.name optional name for the state
 * @param options.role optional role for the state
 * @param options.type optional type for the state
 * @param options.unit optional unit for the state
 * @param options.q optional quality for the state
 */
async function createState(adapter, fullPath, // z.B. "device.channel.state"
stateId, value, options) {
    const { name, role = 'state', type = typeof value, unit, q } = options ?? {};
    const stId = sanitizeId(stateId);
    const fullStatePath = `${fullPath}.${stId}`;
    await adapter.setObjectNotExistsAsync(fullStatePath, {
        type: 'state',
        common: {
            name: ensureTranslatedName(name, stId),
            role,
            type,
            unit,
            read: true,
            write: false,
        },
        native: {},
    });
    const state = {
        val: value,
        ack: true,
    };
    if (q !== undefined) {
        state.q = q;
    }
    await adapter.setState(fullStatePath, state);
}
//# sourceMappingURL=utils.js.map