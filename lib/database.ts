/**
 * @file database.ts
 * @description
 * This file contains all the utility functions for interacting with the browser's IndexedDB.
 * It handles the creation of the database, saving, loading, and deleting custom scenarios.
 * This provides persistent storage for user-created content.
 */

import type { Scenario, CampaignState } from '../types';
import { scenarios as defaultScenarios } from '../scenarios';

// Constants for the database configuration.
const DB_NAME = 'HeistPlannerDB';
const DB_VERSION = 5; // Incremented version to force update of default scenarios
const SCENARIO_STORE_NAME = 'scenarios';
const CAMPAIGN_STORE_NAME = 'campaign';

// A singleton instance of the database connection to avoid opening multiple connections.
let dbInstance: IDBDatabase | null = null;

/**
 * Initializes and opens a connection to the IndexedDB database.
 * It handles the initial creation and schema setup if the database doesn't exist.
 * This function returns a Promise that resolves with the database connection instance.
 * @returns {Promise<IDBDatabase>} A promise that resolves with the database instance.
 */
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // If a connection already exists, reuse it.
    if (dbInstance) {
      return resolve(dbInstance);
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Database error:', request.error);
      reject('Error opening database');
    };

    request.onsuccess = () => {
      dbInstance = request.result;

      // Add an 'onclose' event handler. This is triggered if the connection is
      // closed unexpectedly (e.g., by the browser). By nullifying the instance,
      // we ensure the next DB operation will cleanly reopen the connection.
      dbInstance.onclose = () => {
        console.log('Database connection closed. It will be reopened on the next operation.');
        dbInstance = null;
      };

      // Add an 'onversionchange' event handler. This is critical for handling
      // multi-tab scenarios where another tab requests a database version upgrade.
      dbInstance.onversionchange = () => {
        if (dbInstance) {
          dbInstance.close();
          console.warn("Database connection closed to allow version change from another tab.");
          dbInstance = null;
        }
      };


      resolve(dbInstance);
    };

    /**
     * This event handler is only executed when the database is first created or when the DB_VERSION is incremented.
     * It's used to define the database schema.
     */
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = (event.target as IDBOpenDBRequest).transaction;

      let store;
      if (!db.objectStoreNames.contains(SCENARIO_STORE_NAME)) {
        // Create an object store for scenarios, using 'id' as the unique key.
        store = db.createObjectStore(SCENARIO_STORE_NAME, { keyPath: 'id' });
      } else {
        store = transaction!.objectStore(SCENARIO_STORE_NAME);
      }

      // Always update default scenarios to ensure code changes (fixes) are applied
      Object.values(defaultScenarios).forEach(scenario => {
        store.put(scenario);
      });

      if (!db.objectStoreNames.contains(CAMPAIGN_STORE_NAME)) {
        // Create the new object store for campaign data.
        db.createObjectStore(CAMPAIGN_STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Saves or updates a scenario in the database.
 * It uses the 'put' method, which will add a new record or update an existing one if the key already exists.
 * @param {Scenario} scenario - The scenario object to save.
 * @returns {Promise<void>} A promise that resolves when the transaction is complete.
 */
export function saveScenarioToDB(scenario: Scenario): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction(SCENARIO_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(SCENARIO_STORE_NAME);
    store.put(scenario);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
      console.error('Error saving scenario:', transaction.error);
      reject(transaction.error);
    };
  });
}

/**
 * Retrieves all scenarios from the database.
 * @returns {Promise<Record<string, Scenario>>} A promise that resolves with an object
 * where keys are scenario IDs and values are the scenario objects.
 */
function getScenariosFromDB(): Promise<Record<string, Scenario>> {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction(SCENARIO_STORE_NAME, 'readonly');
    const store = transaction.objectStore(SCENARIO_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const scenariosArray: Scenario[] = request.result;
      const scenariosRecord: Record<string, Scenario> = {};
      // Convert the array of scenarios into a key-value record for easy lookup.
      for (const scenario of scenariosArray) {
        scenariosRecord[scenario.id] = scenario;
      }
      resolve(scenariosRecord);
    };

    request.onerror = () => {
      console.error('Error getting scenarios:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Deletes a scenario from the database by its ID.
 * @param {string} id - The ID of the scenario to delete.
 * @returns {Promise<void>} A promise that resolves when the transaction is complete.
 */
export function deleteScenarioFromDB(id: string): Promise<void> {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction(SCENARIO_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(SCENARIO_STORE_NAME);
    store.delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => {
      console.error('Error deleting scenario:', transaction.error);
      reject(transaction.error);
    };
  });
}

/**
 * Loads all scenarios, combining the hard-coded default scenarios with the custom scenarios
 * stored in IndexedDB. This ensures that user-created maps are available alongside the
 * built-in levels.
 * @returns {Promise<Record<string, Scenario>>} A promise that resolves with the combined record of all scenarios.
 */
export async function loadScenarios(): Promise<Record<string, Scenario>> {
  try {
    const storedScenarios = await getScenariosFromDB();
    // Start with the default scenarios as a base.
    const combinedScenarios: Record<string, Scenario> = { ...defaultScenarios };

    // Overwrite defaults with any custom scenarios from the database that share the same ID,
    // and add any new custom scenarios.
    for (const id in storedScenarios) {
      if (Object.prototype.hasOwnProperty.call(storedScenarios, id)) {
        const scenario = storedScenarios[id];
        // Only keep the stored version if it's a user-created scenario (tier 0)
        // or if it's an official scenario that still exists in our default list.
        // This prevents "zombie" scenarios from old builds appearing in the hub.
        if (scenario.tier === 0) {
          combinedScenarios[id] = scenario;
        } else if (defaultScenarios[id]) {
          // If it's an official scenario, we prioritize the code version (defaultScenarios)
          // unless we specifically want to allow user-edited official scenarios.
          // For now, let's prioritize defaults to ensure fixes apply.
          combinedScenarios[id] = defaultScenarios[id];
        } else {
          // If it's an official ID that's no longer in our hardcoded list, delete it from DB.
          console.log(`Cleaning up obsolete official scenario: ${id}`);
          await deleteScenarioFromDB(id);
        }
      }
    }

    // This logic ensures that if a default scenario was somehow missing from the DB,
    // it gets added/updated.
    for (const defaultId in defaultScenarios) {
      if (Object.prototype.hasOwnProperty.call(defaultScenarios, defaultId)) {
        await saveScenarioToDB(defaultScenarios[defaultId]);
      }
    }

    return combinedScenarios;
  } catch (error) {
    // If the database fails for any reason, fall back to just the default scenarios.
    console.error("Failed to load scenarios from DB, using defaults.", error);
    return defaultScenarios;
  }
}


/**
 * Saves the player's entire campaign state to the database.
 * @param {CampaignState} campaignState - The campaign state object to save.
 * @returns {Promise<void>} A promise that resolves when the transaction is complete.
 */
export function saveCampaignStateToDB(campaignState: CampaignState): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(CAMPAIGN_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(CAMPAIGN_STORE_NAME);
      store.put(campaignState);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => {
        console.error('Error saving campaign state:', transaction.error);
        reject(transaction.error);
      };
    } catch (error) {
      console.error("Failed to initiate DB for saving campaign state:", error);
      reject(error);
    }
  });
}

/**
 * Retrieves the player's campaign state from the database.
 * @returns {Promise<CampaignState | null>} A promise that resolves with the campaign state object, or null if not found.
 */
export function getCampaignStateFromDB(): Promise<CampaignState | null> {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction = db.transaction(CAMPAIGN_STORE_NAME, 'readonly');
      const store = transaction.objectStore(CAMPAIGN_STORE_NAME);
      const request = store.get('player_career');

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        console.error('Error getting campaign state:', request.error);
        reject(request.error);
      };
    } catch (error) {
      console.error("Failed to initiate DB for getting campaign state:", error);
      reject(error);
    }
  });
}

/**
 * Exports the campaign state to a downloadable JSON file.
 * @param {CampaignState} campaignState - The campaign state to export.
 * @param {boolean} isGodMode - Whether God Mode is currently active.
 */
export function exportCampaignToFile(campaignState: CampaignState, customFilename?: string): void {
  const jsonString = JSON.stringify(campaignState, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  if (customFilename) {
    link.download = customFilename;
  } else {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const timestamp = `${yy}${mm}${dd}_${hh}${min}`;

    const lastScenarioId = campaignState.unlockedScenarios[campaignState.unlockedScenarios.length - 1] || 'unknown';

    link.download = `heistology_${lastScenarioId}_cash_${campaignState.totalCash}_rep_${campaignState.reputation}_${timestamp}.json`;
  }

  link.href = url;
  link.click();

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Validates and imports a campaign state from a JSON string.
 * @param {string} fileContent - The JSON string content of the campaign file.
 * @returns {Promise<CampaignState>} A promise that resolves with the validated campaign state.
 * @throws {Error} If the file content is invalid or doesn't match the expected structure.
 */
export function importCampaignFromFile(fileContent: string): Promise<CampaignState> {
  return new Promise((resolve, reject) => {
    try {
      const campaignData = JSON.parse(fileContent) as Partial<CampaignState>;

      // Validate required fields
      if (campaignData.id !== 'player_career') {
        reject(new Error('Invalid campaign file: missing or incorrect id'));
        return;
      }

      if (typeof campaignData.totalCash !== 'number' ||
        typeof campaignData.reputation !== 'number' ||
        !Array.isArray(campaignData.unlockedScenarios) ||
        typeof campaignData.completedObjectives !== 'object') {
        reject(new Error('Invalid campaign file: missing or invalid required fields'));
        return;
      }

      // Construct validated campaign state
      const validatedCampaign: CampaignState = {
        id: 'player_career',
        totalCash: campaignData.totalCash,
        reputation: campaignData.reputation,
        unlockedScenarios: campaignData.unlockedScenarios,
        completedObjectives: campaignData.completedObjectives as Record<string, string[]>,
      };

      resolve(validatedCampaign);
    } catch (error) {
      reject(new Error(`Failed to parse campaign file: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}