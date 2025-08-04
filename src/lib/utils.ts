// utils.ts

type TranslatedName = string | { en: string; [key: string]: string };

export interface CreateStructuredStateOptions {
	deviceName?: TranslatedName;
	channelId?: string;
	channelName?: TranslatedName;
	stateName?: TranslatedName;
	role?: string;
	type?: ioBroker.CommonType;
	unit?: string;
}
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

// ID-Bereinigung
export function sanitizeId(name: string): string {
	return name
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^\w\d-_]/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_+|_+$/g, "")
		.toLowerCase();
}

// Namen absichern
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

//	###########################

export async function createStructuredState(
	adapter: ioBroker.Adapter,
	deviceId: string,
	stateId: string,
	value: ioBroker.StateValue,
	options?: CreateStructuredStateOptions
): Promise<void> {
	const {
		deviceName,
		channelId,
		channelName,
		stateName,
		role = "state",
		type = typeof value as ioBroker.CommonType,
		unit
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

	// State
	await adapter.setObjectNotExistsAsync(statePath, {
		type: "state",
		common: {
			name: ensureTranslatedName(stateName, stateId),
			role,
			type,
			unit,
			read: true,
			write: false
		},
		native: {}
	});

	await adapter.setState(statePath, { val: value, ack: true });
}

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

//	###########################

// 🔧 Device anlegen
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

// 🔧 Channel anlegen
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

// 🔧 Folder anlegen
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

// 🔧 State anlegen + schreiben
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

// 🔧 State anlegen, schreiben und bestätigen
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
