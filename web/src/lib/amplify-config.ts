import { Amplify } from 'aws-amplify';

function cleanEnv(value: string | undefined) {
  return value?.trim() || undefined;
}

const userPoolId =
  cleanEnv(process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID) ??
  cleanEnv(process.env.NEXT_PUBLIC_USER_POOL_ID);
const userPoolClientId = cleanEnv(process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID);

if (!userPoolId || !userPoolClientId) {
  throw new Error(
    "Missing Cognito env. Set NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_CLIENT_ID.",
  );
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      loginWith: {
        email: true,
      },
    },
  },
});
