import { Linking } from 'react-native';

import { CURRENT_LOCATION_SPOT_ID } from '@/domain/spots';
import { MapScreen } from '@/features/map';
import { directionsUrl } from '@/services/directions';
import { useLocation, useSelection } from '@/store';
import { fireEvent, renderWithProviders, screen, waitFor } from '@tests/render';

import { RouteDialog } from '../components';

const LAKE = { latitude: 50.6183, longitude: 30.4812 };
const initialSelection = useSelection.getState();
const initialLocation = useLocation.getState();

beforeEach(() => {
  jest.useRealTimers();
  useSelection.setState(initialSelection, true);
  useLocation.setState({ ...initialLocation, hydrated: true }, true);
});

function renderDialog(onClose = jest.fn()) {
  return renderWithProviders(
    <RouteDialog visible destination={LAKE} name="Затока за дамбою" onClose={onClose} />,
  );
}

describe('RouteDialog', () => {
  it('asks how to get there, offering both ways', async () => {
    await renderDialog();
    expect(screen.getByText('Як дістатися до «Затока за дамбою»?')).toBeOnTheScreen();
    expect(screen.getByLabelText('Маршрут авто до «Затока за дамбою»')).toBeOnTheScreen();
    expect(screen.getByLabelText('Маршрут пішки до «Затока за дамбою»')).toBeOnTheScreen();
  });

  it('opens the maps app of this platform with a driving route, then closes', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const onClose = jest.fn();
    await renderDialog(onClose);

    await fireEvent.press(screen.getByText('Авто'));
    await waitFor(() => expect(open).toHaveBeenCalledWith(directionsUrl(LAKE, 'driving')));
    expect(open.mock.calls[0]?.[0]).toContain('50.6183%2C30.4812');
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('walks instead, when that is the button pressed', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await renderDialog();

    await fireEvent.press(screen.getByText('Пішки'));
    await waitFor(() => expect(open).toHaveBeenCalledWith(directionsUrl(LAKE, 'walking')));
  });

  it('says so when the phone has no maps app to open', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('no handler'));
    const onClose = jest.fn();
    await renderDialog(onClose);

    await fireEvent.press(screen.getByText('Авто'));
    expect(await screen.findByText('Не вдалося відкрити застосунок мап.')).toBeOnTheScreen();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('the route on the map screen', () => {
  it('is offered for the water in view', async () => {
    await renderWithProviders(<MapScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: 'Маршрут' }));
    expect(screen.getByText('Як дістатися до «Затока за дамбою»?')).toBeOnTheScreen();
  });

  it('is not offered for the spot you are standing on', async () => {
    useLocation.setState({ ...initialLocation, hydrated: true, status: 'granted', origin: LAKE });
    useSelection.setState({ ...initialSelection, selectedSpotId: CURRENT_LOCATION_SPOT_ID });

    await renderWithProviders(<MapScreen />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Відкрити' })).toBeOnTheScreen());
    expect(screen.queryByRole('button', { name: 'Маршрут' })).toBeNull();
  });
});
