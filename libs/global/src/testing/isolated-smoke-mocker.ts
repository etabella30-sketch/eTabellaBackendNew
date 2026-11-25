/**
 * Test-only fallback for legacy constructor smoke tests. Each unresolved Nest
 * provider gets its own stub; no network, database or queue is contacted.
 * Behaviour tests should provide explicit mocks instead of using this helper.
 */
export function isolatedSmokeMocker(): object {
  const methods = new Map<PropertyKey, jest.Mock>();
  return new Proxy(Object.create(null), {
    get(_target, key) {
      // The Nest injector may inspect a value as a Promise.
      if (key === 'then') return undefined;
      if (typeof key === 'symbol') return undefined;
      if (!methods.has(key)) methods.set(key, jest.fn());
      return methods.get(key);
    },
  });
}
