import { mock } from 'bun:test';

export function mocked<T extends object>(
  instance: T,
): {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? ReturnType<typeof mock<T[K]>> : T[K];
} {
  const result = {} as any;

  for (const key in instance) {
    const value = instance[key];
    if (typeof value === 'function') {
      result[key] = mock(value as any);
    } else {
      result[key] = value;
    }
  }

  const proto = Object.getPrototypeOf(instance);
  const propertyNames = Object.getOwnPropertyNames(proto);

  for (const name of propertyNames) {
    if (name !== 'constructor' && typeof proto[name] === 'function') {
      result[name] = mock(proto[name]);
    }
  }

  return result;
}
