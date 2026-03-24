type SessionUser = {
  id: string;
  name?: string | null;
  username?: string | null;
  image?: string | null;
};

export function getSidebarUser(user: SessionUser) {
  const fullName = user.name?.trim() ?? "";
  const firstName = fullName.split(" ")[0] ?? "User";
  const userIdFallback = user.id.split(":")[1] ?? user.id;
  const normalizedUsername = user.username?.trim();
  const username =
    normalizedUsername && normalizedUsername.length > 0
      ? `@${normalizedUsername}`
      : fullName.length > 0
        ? `@${fullName.replaceAll(/\s+/g, "").toLowerCase()}`
        : `@${userIdFallback}`;

  return {
    firstName,
    username,
    image: user.image ?? null,
  };
}
