// utils.ts

type TranslatedName = string | { en: string; [key: string]: string };

/**
 * Options for creating a structured state.
 */
export interface CreateStructuredStateOptions {
	deviceName?: TranslatedName;
	channelId?: string;
	channelName?: TranslatedName;
	stateName?: TranslatedName;
	role?: string;
	type?: string;
	unit?: string;
}
/**
 * Options for creating a structured writable state.
 */
export interface CreateStructuredWritableOptions {
	deviceName?: TranslatedName;
	channelId?: string;
	channelName?: TranslatedName;
	stateName?: TranslatedName;
	role?: string;
	type?: ioBroker.CommonType;
	unit?: string;
	q?: number;
}

/**
 * Sanitize a string to create a valid ID.
 * @param name The input string to sanitize.
 * @returns The sanitized string.
 */
export function sanitizeId(name: string): string {
	return name
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^\w\d-_]/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_+|_+$/g, "")
		.toLowerCase();
}

/**
 * Ensures that a translated name is returned in a consistent format.
 * @param name The input name to ensure.
 * @param fallback A fallback name to use if the input is not valid.
 * @returns The ensured translated name.
 */
export function ensureTranslatedName(
	name?: string | { [lang: string]: string },
	fallback?: string
): string | { [lang: string]: string; en: string } {
	if (!name && fallback) return fallback;

	if (typeof name === "string") {
		return name;
	}

	if (typeof name === "object") {
		// Stelle sicher, dass 'en' gesetzt ist – ggf. mit fallback
		return {
			...name,
			en: name.en ?? fallback ?? "unknown"
		};
	}

	return fallback ?? "unknown";
}

/**
 * Creates a structured writable state in the ioBroker.
 * @param adapter The ioBroker adapter instance.
 * @param deviceId The ID of the device.
 * @param stateId The ID of the state.
 * @param value The value to set for the state.
 * @param options Options for creating the structured writable state.
 */
export async function createStructuredWritableState(
	adapter: ioBroker.Adapter,
	deviceId: string,
	stateId: string,
	value: ioBroker.StateValue,
	options?: CreateStructuredWritableOptions
	): Promise<void> {
	const {
		deviceName,
		channelId,
		channelName,
		stateName,
		role = "state",
		type = typeof value as ioBroker.CommonType,
		unit,
		q
	} = options ?? {};

	const devicePath = deviceId;
	const channelPath = channelId ? `${devicePath}.${channelId}` : undefined;
	const statePath = channelPath ? `${channelPath}.${stateId}` : `${devicePath}.${stateId}`;

	// Device
	await adapter.setObjectNotExistsAsync(devicePath, {
		type: "device",
		common: {
			name: ensureTranslatedName(deviceName, deviceId)
		},
		native: {}
	});

	// Channel (optional)
	if (channelPath) {
		await adapter.setObjectNotExistsAsync(channelPath, {
			type: "channel",
			common: {
				name: ensureTranslatedName(channelName, channelId!)
			},
			native: {}
		});
	}

	// State (writeable)
	await adapter.setObjectNotExistsAsync(statePath, {
		type: "state",
		common: {
			name: ensureTranslatedName(stateName, stateId),
			role,
			type,
			unit,
			read: true,
			write: true
		},
		native: {}
	});
	//await adapter.setState(statePath, { val: value, ack: false, q: q !== undefined ? q : undefined } as ioBroker.State);

	const state: Pick<ioBroker.State, "val" | "ack"> & Partial<Pick<ioBroker.State, "q">> = {
		val: value,
		ack: false
		};

		if (q !== undefined) {
			state.q = q as ioBroker.State["q"];
		}
		
	await adapter.setState(statePath, state);
}

/**
 * 🔧 Creates a device in the ioBroker.
 * @param adapter The ioBroker adapter instance.
 * @param deviceId The ID of the device.
 * @param name The name of the device.
 * @returns The ID of the created device.
 */
export async function createDevice(
	adapter: ioBroker.Adapter,
	deviceId: string,
	name?: string | { [lang: string]: string }
): Promise<string> {
	const id = sanitizeId(deviceId);
	await adapter.setObjectNotExistsAsync(id, {
		type: "device",
		common: {
			name: ensureTranslatedName(name, id)
		},
		native: {}
	});
	return id;
}

/**
 * 🔧 Creates a channel in the ioBroker.
 * @param adapter The ioBroker adapter instance.
 * @param deviceId The ID of the device.
 * @param channelId The ID of the channel.
 * @param name The name of the channel.
 * @returns The ID of the created channel.
 */
export async function createChannel(
	adapter: ioBroker.Adapter,
	deviceId: string,
	channelId: string,
	name?: string | { [lang: string]: string }
): Promise<string> {
	const devId = sanitizeId(deviceId);
	const chId = sanitizeId(channelId);
	const fullId = `${devId}.${chId}`;
	await adapter.setObjectNotExistsAsync(fullId, {
		type: "channel",
		common: {
			name: ensureTranslatedName(name, chId)
		},
		native: {}
	});
	return fullId;
}

/**
 * 🔧 Creates a folder in the ioBroker.
 * @param adapter The ioBroker adapter instance.
 * @param deviceId The ID of the device.
 * @param folderId The ID of the folder.
 * @param name The name of the folder.
 * @returns The ID of the created folder.
 */
export async function createFolder(
	adapter: ioBroker.Adapter,
	deviceId: string,
	folderId: string,
	name?: string | { [lang: string]: string }
): Promise<string> {
	const devId = sanitizeId(deviceId);
	const fId = sanitizeId(folderId);
	const fullId = `${devId}.${fId}`;
	await adapter.setObjectNotExistsAsync(fullId, {
		type: "folder",
		common: {
			name: ensureTranslatedName(name, fId)
		},
		native: {}
	});
	return fullId;
}

/**
 * 🔧 Creates a writable state in the ioBroker.
 * @param adapter The ioBroker adapter instance.
 * @param fullPath The full path of the state (e.g., "device.channel.state").
 * @param stateId The ID of the state.
 * @param value The initial value of the state.
 * @param options Options for creating the writable state.
 */
export async function createWritableState(
	adapter: ioBroker.Adapter,
	fullPath: string, // z. B. "device.channel.state"
	stateId: string,
	value: ioBroker.StateValue,
	options?: {
		name?: string | { [lang: string]: string };
		role?: string;
		type?: ioBroker.CommonType;
		unit?: string;
		q?: ioBroker.State["q"];
	}
): Promise<void> {
	const {
		name,
		role = "state",
		type = typeof value as ioBroker.CommonType,
		unit,
		q
	} = options ?? {};

	const stId = sanitizeId(stateId);
	const fullStatePath = `${fullPath}.${stId}`;

	await adapter.setObjectNotExistsAsync(fullStatePath, {
		type: "state",
		common: {
			name: ensureTranslatedName(name, stId),
			role,
			type,
			unit,
			read: true,
			write: true
		},
		native: {}
	});

	const state: Pick<ioBroker.State, "val" | "ack"> & Partial<Pick<ioBroker.State, "q">> = {
		val: value,
		ack: false
	};

	if (q !== undefined) {
		state.q = q as ioBroker.State["q"];
	}

	await adapter.setState(fullStatePath, state);
}

/**
 * 🔧 Creates a state in the ioBroker.
 * @param adapter The ioBroker adapter instance.
 * @param fullPath The full path of the state (e.g., "device.channel.state").
 * @param stateId The ID of the state.
 * @param value The initial value of the state.
 * @param options Options for creating the state.
 */
export async function createState(
	adapter: ioBroker.Adapter,
	fullPath: string, // z. B. "device.channel.state"
	stateId: string,
	value: ioBroker.StateValue,
	options?: {
		name?: string | { [lang: string]: string };
		role?: string;
		type?: ioBroker.CommonType;
		unit?: string;
		q?: ioBroker.State["q"];
	}
): Promise<void> {
	const {
		name,
		role = "state",
		type = typeof value as ioBroker.CommonType,
		unit,
		q
	} = options ?? {};

	const stId = sanitizeId(stateId);
	const fullStatePath = `${fullPath}.${stId}`;

	await adapter.setObjectNotExistsAsync(fullStatePath, {
		type: "state",
		common: {
			name: ensureTranslatedName(name, stId),
			role,
			type,
			unit,
			read: true,
			write: false
		},
		native: {}
	});

	const state: Pick<ioBroker.State, "val" | "ack"> & Partial<Pick<ioBroker.State, "q">> = {
		val: value,
		ack: true
	};

	if (q !== undefined) {
		state.q = q as ioBroker.State["q"];
	}

	await adapter.setState(fullStatePath, state);
}
