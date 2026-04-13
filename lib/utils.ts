/**
 * @file utils.ts
 * @description
 * This file contains generic utility functions used across the application,
 * such as a robust deep cloning function.
 */

/**
 * Creates a deep clone of a value.
 * This function is more robust than `JSON.parse(JSON.stringify(value))` because it
 * correctly handles `Set` objects and other non-JSON-serializable types.
 * @param {T} source The value to clone.
 * @returns {T} A deep copy of the source value.
 */
export function deepClone<T>(source: T): T {
  // Handle primitive types and null
  if (source === null || typeof source !== 'object') {
    return source;
  }

  // Handle Maps
  if (source instanceof Map) {
    const newMap = new Map();
    source.forEach((value, key) => {
      newMap.set(deepClone(key), deepClone(value)); // Recursively clone both keys and values
    });
    return newMap as any;
  }

  // Handle Sets
  if (source instanceof Set) {
    const newSet = new Set();
    source.forEach(value => {
      newSet.add(deepClone(value)); // Recursively clone values in the set
    });
    return newSet as any;
  }

  // Handle Arrays
  if (Array.isArray(source)) {
    const newArray: any[] = [];
    for (let i = 0; i < source.length; i++) {
      newArray[i] = deepClone(source[i]); // Recursively clone array elements
    }
    return newArray as any;
  }

  // Handle Objects
  const newObject: { [key: string]: any } = {};
  for (const key in source) {
    // Ensure we only copy own properties, not properties from the prototype chain
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      newObject[key] = deepClone(source[key]); // Recursively clone object properties
    }
  }

  return newObject as T;
}
