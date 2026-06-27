import {
  fetchAuthSession,
  fetchUserAttributes,
  getCurrentUser,
  signOut,
} from "aws-amplify/auth";
import "@/lib/amplify-config";

export type AdminSession = {
  token: string;
  email: string;
  name: string;
  username: string;
  userId: string;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  try {
    const [currentUser, attributes, session] = await Promise.all([
      getCurrentUser(),
      fetchUserAttributes(),
      fetchAuthSession(),
    ]);
    const email = attributes.email ?? currentUser.signInDetails?.loginId ?? currentUser.username;

    return {
      token: session.tokens?.accessToken?.toString() ?? "",
      email,
      name: attributes.name ?? email,
      username: currentUser.username,
      userId: currentUser.userId,
    };
  } catch {
    return null;
  }
}

export async function clearAdminSession() {
  await signOut();
}

export async function isAdminAuthenticated() {
  const s = await getAdminSession();
  return Boolean(s && s.token);
}
