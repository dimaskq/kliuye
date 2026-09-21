import { useLocalSearchParams } from 'expo-router';

import { CatchScreen } from '@/features/diary';

export default function CatchEntry() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <CatchScreen id={id} />;
}
