export function getSessionUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const user =
    localStorage.getItem("usuario");

  if (!user) {
    return null;
  }

  return JSON.parse(user);
}