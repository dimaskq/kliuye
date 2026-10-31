import { renderHook } from '@tests/render';

import { useLeave } from '../useLeave';

function routerWithHistory(canGoBack: boolean) {
  const router = { back: jest.fn(), replace: jest.fn(), canGoBack: () => canGoBack };
  /* The mocked module itself: a wildcard import would only be a copy of it. */
  const mocked = jest.requireMock<{ useRouter: () => unknown }>('expo-router');
  jest.spyOn(mocked, 'useRouter').mockReturnValue(router);
  return router;
}

afterEach(() => jest.restoreAllMocks());

describe('useLeave', () => {
  it('goes back where the angler came from', async () => {
    const router = routerWithHistory(true);
    const { result } = await renderHook(() => useLeave('/diary'));
    result.current();
    expect(router.back).toHaveBeenCalled();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('opens the fallback when the page was the first thing opened, as after a reload', async () => {
    const router = routerWithHistory(false);
    const { result } = await renderHook(() => useLeave('/diary'));
    result.current();
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/diary');
  });

  it('falls back to Today when no page is named', async () => {
    const router = routerWithHistory(false);
    const { result } = await renderHook(() => useLeave());
    result.current();
    expect(router.replace).toHaveBeenCalledWith('/');
  });
});
