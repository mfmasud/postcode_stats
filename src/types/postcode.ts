/**
 * Represents a pair of latitude and longitude floats (WGS84)
 * @typedef {Object} LocationPair
 * @property {number} latitude - The latitude of the location.
 * @property {number} longitude - The longitude of the location.
 */
export interface LocationPair {
    latitude: number
    longitude: number
}

export interface ExtAPIPostcodeResponse {
    postcode: string
    eastings: number
    northings: number
    country: string
    longitude: number
    latitude: number
    region: string | null
    parliamentary_constituency: string
    admin_district: string
    admin_ward: string
    parish: string | null
    admin_county: string | null
}
