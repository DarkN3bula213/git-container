export enum Key {
  roles = 'roles',
}
export enum DynamicKey {
  CLASS = 'class',
}

export type DynamicKeyType = `${DynamicKey}:${string}`;

export function getDynamicKey(key: DynamicKey, suffix: string) {
  const dynamic: DynamicKeyType = `${key}:${suffix}`;
  return dynamic;
}

export const usersKey = (userId: string) => `users#${userId}`;
export const roleKey = (userId: string) => `role#${userId}`;
