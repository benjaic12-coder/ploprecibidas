// Malformed percent escapes must not stop the application before React mounts.
export function routeParameter(value:string):string|null {
 try { return decodeURIComponent(value); } catch { return null; }
}
