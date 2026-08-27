type CoordinateValue = number | string | null | undefined

export type Coordinates = {
    easting?: CoordinateValue
    northing?: CoordinateValue
    latitude?: CoordinateValue
    longitude?: CoordinateValue
}

export type LocatedValue<T> = {
    value: T
    coordinates: Coordinates
}

const EARTH_RADIUS_METRES = 6_371_000

function parseCoordinate(value: CoordinateValue): number | undefined {
    if (
        value === null ||
        value === undefined ||
        (typeof value === "string" && value.trim() === "")
    ) {
        return undefined
    }

    const parsed = typeof value === "number" ? value : Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
}

function getBngDistanceMetres(
    origin: Coordinates,
    destination: Coordinates
): number | undefined {
    const originEasting = parseCoordinate(origin.easting)
    const originNorthing = parseCoordinate(origin.northing)
    const destinationEasting = parseCoordinate(destination.easting)
    const destinationNorthing = parseCoordinate(destination.northing)

    if (
        originEasting === undefined ||
        originNorthing === undefined ||
        destinationEasting === undefined ||
        destinationNorthing === undefined
    ) {
        return undefined
    }

    return Math.hypot(
        destinationEasting - originEasting,
        destinationNorthing - originNorthing
    )
}

function getWgs84DistanceMetres(
    origin: Coordinates,
    destination: Coordinates
): number | undefined {
    const originLatitude = parseCoordinate(origin.latitude)
    const originLongitude = parseCoordinate(origin.longitude)
    const destinationLatitude = parseCoordinate(destination.latitude)
    const destinationLongitude = parseCoordinate(destination.longitude)

    if (
        originLatitude === undefined ||
        originLongitude === undefined ||
        destinationLatitude === undefined ||
        destinationLongitude === undefined ||
        Math.abs(originLatitude) > 90 ||
        Math.abs(destinationLatitude) > 90 ||
        Math.abs(originLongitude) > 180 ||
        Math.abs(destinationLongitude) > 180
    ) {
        return undefined
    }

    const degreesToRadians = Math.PI / 180
    const latitudeDelta =
        (destinationLatitude - originLatitude) * degreesToRadians
    const longitudeDelta =
        (destinationLongitude - originLongitude) * degreesToRadians
    const originLatitudeRadians = originLatitude * degreesToRadians
    const destinationLatitudeRadians = destinationLatitude * degreesToRadians

    const haversine =
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(originLatitudeRadians) *
            Math.cos(destinationLatitudeRadians) *
            Math.sin(longitudeDelta / 2) ** 2
    const boundedHaversine = Math.min(1, Math.max(0, haversine))

    return (
        2 *
        EARTH_RADIUS_METRES *
        Math.atan2(
            Math.sqrt(boundedHaversine),
            Math.sqrt(1 - boundedHaversine)
        )
    )
}

/**
 * Returns distance in metres, preferring the cheaper British National Grid
 * calculation and falling back to WGS84 coordinates when BNG is unavailable.
 */
function getDistanceMetres(
    origin: Coordinates,
    destination: Coordinates
): number | undefined {
    return (
        getBngDistanceMetres(origin, destination) ??
        getWgs84DistanceMetres(origin, destination)
    )
}

/**
 * Returns the nearest values inside the radius while preserving each value's
 * original shape.
 */
function findNearestWithinRadius<T>(
    origin: Coordinates,
    candidates: ReadonlyArray<LocatedValue<T>>,
    radiusMetres: number,
    limit: number
): T[] {
    if (
        !Number.isFinite(radiusMetres) ||
        radiusMetres < 0 ||
        !Number.isInteger(limit) ||
        limit < 1
    ) {
        return []
    }

    return candidates
        .map((candidate, index) => ({
            ...candidate,
            distanceMetres: getDistanceMetres(
                origin,
                candidate.coordinates
            ),
            index,
        }))
        .filter(
            (
                candidate
            ): candidate is LocatedValue<T> & {
                distanceMetres: number
                index: number
            } =>
                candidate.distanceMetres !== undefined &&
                candidate.distanceMetres <= radiusMetres
        )
        .sort(
            (first, second) =>
                first.distanceMetres - second.distanceMetres ||
                first.index - second.index
        )
        .slice(0, limit)
        .map(({ value }) => value)
}

export { findNearestWithinRadius, getDistanceMetres }
