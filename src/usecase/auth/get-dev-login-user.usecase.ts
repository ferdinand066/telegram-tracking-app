import "server-only";

import { userRepository } from "~/repository/user.repository";

export async function getDevLoginUserUseCase(username: string) {
  const normalizedUsername = username.trim();
  if (!normalizedUsername) {
    return null;
  }

  return userRepository.findByUsername(normalizedUsername);
}
