"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var utils_exports = {};
__export(utils_exports, {
  createChannel: () => createChannel,
  createDevice: () => createDevice,
  createFolder: () => createFolder,
  createState: () => createState,
  createStructuredWritableState: () => createStructuredWritableState,
  createWritableState: () => createWritableState,
  ensureTranslatedName: () => ensureTranslatedName,
  sanitizeId: () => sanitizeId
});
module.exports = __toCommonJS(utils_exports);
function sanitizeId(name) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\d-_]/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "").toLowerCase();
}
function ensureTranslatedName(name, fallback) {
  var _a, _b;
  if (!name && fallback) {
    return fallback;
  }
  if (typeof name === "string") {
    return name;
  }
  if (typeof name === "object") {
    return {
      ...name,
      en: (_b = (_a = name.en) != null ? _a : fallback) != null ? _b : "unknown"
    };
  }
  return fallback != null ? fallback : "unknown";
}
async function createStructuredWritableState(adapter, deviceId, stateId, value, options) {
  const {
    deviceName,
    channelId,
    channelName,
    stateName,
    role = "state",
    type = typeof value,
    unit,
    q
  } = options != null ? options : {};
  const devicePath = deviceId;
  const channelPath = channelId ? `${devicePath}.${channelId}` : void 0;
  const statePath = channelPath ? `${channelPath}.${stateId}` : `${devicePath}.${stateId}`;
  await adapter.setObjectNotExistsAsync(devicePath, {
    type: "device",
    common: {
      name: ensureTranslatedName(deviceName, deviceId)
    },
    native: {}
  });
  if (channelPath) {
    await adapter.setObjectNotExistsAsync(channelPath, {
      type: "channel",
      common: {
        name: ensureTranslatedName(channelName, channelId)
        //!
      },
      native: {}
    });
  }
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
  const state = {
    val: value,
    ack: false
  };
  if (q !== void 0) {
    state.q = q;
  }
  await adapter.setState(statePath, state);
}
async function createDevice(adapter, deviceId, name) {
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
async function createChannel(adapter, deviceId, channelId, name) {
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
async function createFolder(adapter, deviceId, folderId, name) {
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
async function createWritableState(adapter, fullPath, stateId, value, options) {
  const { name, role = "state", type = typeof value, unit, q } = options != null ? options : {};
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
  const state = {
    val: value,
    ack: false
  };
  if (q !== void 0) {
    state.q = q;
  }
  await adapter.setState(fullStatePath, state);
}
async function createState(adapter, fullPath, stateId, value, options) {
  const { name, role = "state", type = typeof value, unit, q } = options != null ? options : {};
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
  const state = {
    val: value,
    ack: true
  };
  if (q !== void 0) {
    state.q = q;
  }
  await adapter.setState(fullStatePath, state);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createChannel,
  createDevice,
  createFolder,
  createState,
  createStructuredWritableState,
  createWritableState,
  ensureTranslatedName,
  sanitizeId
});
//# sourceMappingURL=utils.js.map
