export function toKebab(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function toSnake(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function toCamel(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/^[^a-z]/, (c) => c.toLowerCase());
}

// Registry key: camelCase from name
export function registryKey(name: string) {
  return toCamel(name);
}

// Connection name: snake_case + _connection
export function connectionName(name: string) {
  return toSnake(name) + "_connection";
}
