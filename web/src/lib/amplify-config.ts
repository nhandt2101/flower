import { Amplify } from 'aws-amplify';

function cleanEnv(value: string | undefined) {
  return value?.trim() || undefined;
}

const userPoolId =
  cleanEnv(process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID) ??
  cleanEnv(process.env.NEXT_PUBLIC_USER_POOL_ID);
const userPoolClientId = cleanEnv(process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID);

export const isAmplifyConfigured = Boolean(userPoolId && userPoolClientId);

if (isAmplifyConfigured) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: userPoolId!,
        userPoolClientId: userPoolClientId!,
        loginWith: {
          email: true,
        },
      },
    },
  });
}
