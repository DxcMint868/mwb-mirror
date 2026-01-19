import { createId } from '@paralleldrive/cuid2';

export function generatedId() {
  const id = createId();
  return id;
}
