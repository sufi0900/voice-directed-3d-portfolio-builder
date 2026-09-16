export function safeNextPath(value: string | undefined, fallback = "/projects") {
  return value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : fallback;
}

export function guestClaimPath(authenticated: boolean) {
  return authenticated ? "/claim" : "/login?next=/claim";
}
