import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
  ISignUpResult,
} from 'amazon-cognito-identity-js';

// Validate env vars at module load time
const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID;
const clientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID;

if (!userPoolId || !clientId) {
  console.warn('Missing Cognito configuration. Auth will not work.');
}

const userPool = new CognitoUserPool({
  UserPoolId: userPoolId || '',
  ClientId: clientId || '',
});

export interface UserData {
  email?: string;
  name?: string;
  token: string;
  [key: string]: string | undefined;
}

export async function signUp(email: string, password: string, name: string): Promise<ISignUpResult | undefined> {
  return new Promise((resolve, reject) => {
    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'name', Value: name }),
    ];

    userPool.signUp(email, password, attributeList, [], (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

export async function confirmSignUp(email: string, code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

export async function signIn(email: string, password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result: CognitoUserSession) => {
        const token = result.getIdToken().getJwtToken();
        localStorage.setItem('idToken', token);
        resolve(token);
      },
      onFailure: (err) => {
        reject(err);
      },
    });
  });
}

export function signOut(): void {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
  localStorage.removeItem('idToken');
}

export async function getCurrentUser(): Promise<UserData> {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();

    if (!cognitoUser) {
      reject(new Error('No user found'));
      return;
    }

    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err) {
        reject(err);
        return;
      }

      if (!session || !session.isValid()) {
        reject(new Error('Session invalid'));
        return;
      }

      cognitoUser.getUserAttributes((attrErr, attributes) => {
        if (attrErr) {
          reject(attrErr);
          return;
        }

        const userData: UserData = {
          token: session.getIdToken().getJwtToken(),
        };

        attributes?.forEach((attr) => {
          userData[attr.Name] = attr.Value;
        });

        resolve(userData);
      });
    });
  });
}

export function getIdToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('idToken');
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}
