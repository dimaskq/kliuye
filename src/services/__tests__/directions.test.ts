import { Linking } from 'react-native';

import { directionsUrl, openDirections } from '../directions';

const LAKE = { latitude: 50.6183, longitude: 30.4812 };

describe('directionsUrl', () => {
  it('sends Android and the browser to Google Maps, in the chosen mode', () => {
    expect(directionsUrl(LAKE, 'driving', 'android')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=50.6183%2C30.4812&travelmode=driving',
    );
    expect(directionsUrl(LAKE, 'walking', 'web')).toContain('travelmode=walking');
  });

  it('sends iOS to Apple Maps, whose modes are single letters', () => {
    expect(directionsUrl(LAKE, 'driving', 'ios')).toBe(
      'https://maps.apple.com/?daddr=50.6183%2C30.4812&dirflg=d',
    );
    expect(directionsUrl(LAKE, 'walking', 'ios')).toContain('dirflg=w');
  });

  it('keeps the full coordinate, not the rounded one the forecast uses', () => {
    expect(
      directionsUrl({ latitude: 50.61834, longitude: 30.48127 }, 'driving', 'android'),
    ).toContain('50.61834%2C30.48127');
  });

  it('leaves the starting point to the navigation app', () => {
    expect(directionsUrl(LAKE, 'driving', 'android')).not.toContain('origin');
    expect(directionsUrl(LAKE, 'driving', 'ios')).not.toContain('saddr');
  });
});

describe('openDirections', () => {
  it('hands the link to the system and reports success', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await expect(openDirections(LAKE, 'walking')).resolves.toBe(true);
    expect(open).toHaveBeenCalledWith(expect.stringContaining('maps'));
  });

  it('answers false when the device has nothing to open it with', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no handler'));
    await expect(openDirections(LAKE, 'driving')).resolves.toBe(false);
  });
});
