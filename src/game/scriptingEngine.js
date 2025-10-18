import { produce } from "immer";
import { HARDWARE_CATALOG } from "../data";

class ScriptingEngine {
  constructor() {
    this.api = {};
  }

  createApi(getState) {
    return {
      getServers: () => getState().servers.map((s) => s.id),
      getServerDetails: (id) => {
        const server = getState().servers.find((s) => s.id === id);
        return server ? { ...server } : null; // Return a copy
      },
      getCash: () => getState().cash,
      getReputation: () => getState().reputation,
      getPowerUsage: () => getState().power.usage,
      getPowerCapacity: () => getState().power.capacity,
      getTemperature: () => getState().environment.temperature,
      getHardwareCatalog: () => HARDWARE_CATALOG,
      log: (message) => {
        // This will be logged to the in-game console
        console.log(`SCRIPT LOG: ${message}`);
        getState().addLog({ source: "Script", message });
      },
    };
  }

  run(scriptCode, args = [], getState) {
    const api = this.createApi(getState);
    let result = null;
    let error = null;

    // A very basic sandboxed environment
    const sandbox = {
      ...api,
      args: args,
      console: {
        log: api.log, // Redirect console.log to our in-game log
      },
    };

    try {
      // Wrap the user's code in a function to control its scope
      const scriptFunction = new Function(
        ...Object.keys(sandbox),
        `${scriptCode}\nreturn main(...args);`
      );
      result = scriptFunction(...Object.values(sandbox));
    } catch (e) {
      error = e.message;
      console.error("Scripting Error:", e);
      api.log(`ERROR: ${e.message}`);
    }

    return result !== null ? result : error;
  }
}

export const scriptingEngine = new ScriptingEngine();
