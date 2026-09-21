import { CatalogScreen } from '@/features/catalog';

/** Development only: the route renders nothing in a release build. */
export default function DevCatalog() {
  return __DEV__ ? <CatalogScreen /> : null;
}
