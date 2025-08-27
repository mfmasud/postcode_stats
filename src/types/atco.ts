/**
 * @file Type definitions for ATCO related data structures
 * @module types/atco
 * @author Mohammed Fardhin Masud <fardhinmasud@gmail.com>
 * 
 * This file contains reusable type definitions for ATCO codes and related data structures
 * to avoid repetition across the codebase and ensure type safety.
 */

/**
 * Represents the location and region information for an ATCO code
 */
export interface AtcoCodeInfo {
  /** The location/area name (e.g., "Aberdeenshire") */
  location: string;
  /** The region name (e.g., "Scotland") */
  region: string;
}

/**
 * A single ATCO code mapped to its location and region information
 * Key: ATCO code (e.g., "630")
 * Value: Location and region information
 */
export type ProcessedAtcoCode = Record<string, AtcoCodeInfo>;

/**
 * Raw ATCO string format as received from the API
 * Example: "Aberdeenshire / Scotland (630)"
 */
export type RawAtcoString = string;

/**
 * Individual ATCO code (numeric string)
 * Example: "630"
 */
export type AtcoCode = string;
