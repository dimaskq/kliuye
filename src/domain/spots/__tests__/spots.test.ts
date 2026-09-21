import {
  CURRENT_LOCATION_SPOT_ID,
  CUSTOM_SPOT_ID,
  DEFAULT_SPOT,
  NEARBY_RADIUS_KM,
  SPOTS,
  currentLocationSpot,
  customSpot,
  resolveSpot,
  spotById,
  spotsNear,
} from '../index';

const KYIV_SEA = { latitude: 50.62, longitude: 30.48 };
const VARNA = { latitude: 43.21, longitude: 27.91 };

describe('spots', () => {
  it('exposes a bundled catalogue with unique ids', () => {
    const ids = SPOTS.map((spot) => spot.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('names every spot and its region through i18n keys', () => {
    SPOTS.forEach((spot) => {
      expect(spot.nameKey).toMatch(/^spots\..+\.name$/);
      expect(spot.metaKey).toMatch(/^spots\..+\.meta$/);
      expect(spot.regionKey).toMatch(/^spots\.region\./);
    });
  });

  it('falls back to the default spot for an unknown or missing id', () => {
    expect(spotById('s2').id).toBe('s2');
    expect(spotById('nope')).toBe(DEFAULT_SPOT);
    expect(spotById(undefined)).toBe(DEFAULT_SPOT);
  });

  it('resolves the current-location id only while we have a position', () => {
    expect(
      resolveSpot({ selectedId: CURRENT_LOCATION_SPOT_ID, origin: VARNA }).coordinates,
    ).toEqual(VARNA);
    expect(resolveSpot({ selectedId: CURRENT_LOCATION_SPOT_ID })).toBe(DEFAULT_SPOT);
  });

  it('leaves the bank unknown for the device position', () => {
    expect(currentLocationSpot(VARNA).shoreBearingDeg).toBeUndefined();
  });

  it('keeps catalogue order and no distances without a reference point', () => {
    const near = spotsNear(undefined);
    expect(near.map((spot) => spot.id)).toEqual(SPOTS.map((spot) => spot.id));
    near.forEach((spot) => expect(spot.distanceKm).toBeUndefined());
  });

  it('offers the device position first, then nearby waters closest first', () => {
    const near = spotsNear(KYIV_SEA);
    expect(near[0]?.id).toBe(CURRENT_LOCATION_SPOT_ID);

    const catalogue = near.slice(1).map((spot) => spot.distanceKm ?? 0);
    expect([...catalogue].sort((a, b) => a - b)).toEqual(catalogue);
    catalogue.forEach((distance) => expect(distance).toBeLessThanOrEqual(NEARBY_RADIUS_KM));
  });

  it('names a picked point by its settlement once one is known', () => {
    const searched = customSpot({ ...VARNA, label: 'Варна' });
    expect(searched.nameKey).toBe('spots.custom.named');
    expect(searched.nameParams).toEqual({ place: 'Варна', position: '43.210, 27.910' });
  });

  it('says where an unnamed point is rather than guessing a name for it', () => {
    const tapped = customSpot({ ...VARNA, label: '' });
    expect(tapped.nameKey).toBe('spots.custom.unnamed');
    expect(tapped.metaParams?.['position']).toBe('43.210, 27.910');
  });

  it('labels the device position by settlement when known, by coordinates when not', () => {
    expect(currentLocationSpot(VARNA, 'Варна').regionKey).toBe('spots.here.region.named');
    expect(currentLocationSpot(VARNA, 'Варна').regionParams?.['place']).toBe('Варна');
    expect(currentLocationSpot(VARNA).regionKey).toBe('spots.here.region.unnamed');
    expect(currentLocationSpot(VARNA).regionParams?.['position']).toBe('43.210, 27.910');
  });

  it('puts the coordinates under a picked point, not a category word', () => {
    const spot = customSpot({ ...VARNA, label: 'Наш берег' });
    expect(spot.regionKey).toBe('spots.custom.region');
    expect(spot.regionParams?.['position']).toBe('43.210, 27.910');
  });

  it('leaves the bank unknown for a picked point too', () => {
    expect(customSpot({ ...VARNA, label: 'Варна' }).shoreBearingDeg).toBeUndefined();
  });

  it('offers a picked point first, ahead of the position and the catalogue', () => {
    const near = spotsNear(KYIV_SEA, { ...VARNA, label: 'Варна' });
    expect(near[0]?.id).toBe(CUSTOM_SPOT_ID);
    expect(near[1]?.id).toBe(CURRENT_LOCATION_SPOT_ID);
  });

  it('offers a picked point even with no position at all', () => {
    const near = spotsNear(undefined, { ...VARNA, label: 'Варна' });
    expect(near[0]?.id).toBe(CUSTOM_SPOT_ID);
    expect(near).toHaveLength(SPOTS.length + 1);
  });

  it('offers only the device position far from the catalogue', () => {
    const near = spotsNear(VARNA);
    expect(near).toHaveLength(1);
    expect(near[0]?.id).toBe(CURRENT_LOCATION_SPOT_ID);
    expect(near[0]?.distanceKm).toBe(0);
  });
});

describe('resolveSpot', () => {
  const picked = { ...VARNA, label: 'Варна' };

  it('prefers a picked point over everything else', () => {
    const spot = resolveSpot({ selectedId: CUSTOM_SPOT_ID, origin: KYIV_SEA, customPoint: picked });
    expect(spot.id).toBe(CUSTOM_SPOT_ID);
    expect(spot.coordinates).toEqual({ latitude: VARNA.latitude, longitude: VARNA.longitude });
  });

  it('prefers an explicit catalogue choice over the device position', () => {
    expect(resolveSpot({ selectedId: 's3', origin: VARNA }).id).toBe('s3');
  });

  it('falls back to the device position when nothing was chosen', () => {
    expect(resolveSpot({ selectedId: undefined, origin: VARNA }).id).toBe(CURRENT_LOCATION_SPOT_ID);
  });

  it('falls back to the bundled water when nothing is known', () => {
    expect(resolveSpot({ selectedId: undefined })).toBe(DEFAULT_SPOT);
  });

  it('falls through a selection that no longer resolves', () => {
    expect(resolveSpot({ selectedId: CUSTOM_SPOT_ID, origin: VARNA }).id).toBe(
      CURRENT_LOCATION_SPOT_ID,
    );
    expect(resolveSpot({ selectedId: 'gone' })).toBe(DEFAULT_SPOT);
  });
});
