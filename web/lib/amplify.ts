import { Amplify } from 'aws-amplify';

// TODO: Replace with actual Amplify configuration
// For now, commented out to avoid TypeScript errors during development
// const amplifyConfig = {
//   Auth: {
//     region: process.env.AMPLIFY_REGION || 'us-east-1',
//     userPoolId: process.env.COGNITO_USER_POOL_ID || 'your_user_pool_id',
//     userPoolWebClientId:
//       process.env.COGNITO_USER_POOL_CLIENT_ID || 'your_client_id',
//   },
// };

// Only configure if we have valid config
// if (
//   process.env.COGNITO_USER_POOL_ID &&
//   process.env.COGNITO_USER_POOL_CLIENT_ID
// ) {
//   Amplify.configure(amplifyConfig);
// }

export default Amplify;
