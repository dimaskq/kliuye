import { setupServer } from 'msw/node';

/** One HTTP mock server for the whole suite; each test declares its own handlers. */
export const server = setupServer();
