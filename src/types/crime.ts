// based on https://data.police.uk/docs/

export interface RawCrimeLocation {
    latitude: string
    longitude: string
    street: {
        id: number
        name: string
    }
}

export interface RawCrimeOutcomeStatus {
    category: string
    date: string
}

export interface RawCrimeRecord {
    category: string
    persistent_id: string // can be empty string
    location_subtype: string
    id: number
    location: RawCrimeLocation
    context: string
    month: string // "YYYY-MM"
    location_type: string // "Force" | "BTP"
    outcome_status: RawCrimeOutcomeStatus | null
}

export type CrimeAPIResponse = RawCrimeRecord[]
