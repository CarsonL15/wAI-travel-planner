import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import { Auth } from 'aws-amplify';

// TODO: Replace with actual AppSync configuration
const client = new AWSAppSyncClient({
  url: process.env.APPSYNC_GRAPHQL_ENDPOINT || 'your_graphql_endpoint',
  region: process.env.AMPLIFY_REGION || 'us-east-1',
  auth: {
    type: AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
    jwtToken: async () => {
      try {
        const session = await Auth.currentSession();
        return session.getIdToken().getJwtToken();
      } catch (error) {
        console.error('Error getting JWT token:', error);
        return '';
      }
    },
  },
  disableOffline: false,
});

export default client;

// GraphQL operations will be defined here
export const queries = {
  // TODO: Add actual GraphQL queries
  GET_PROFILE: `
    query GetProfile($userId: ID!) {
      getProfile(userId: $userId) {
        id
        interests
        travelStyle
        budget
        constraints
      }
    }
  `,
  LIST_ITINERARIES: `
    query ListItineraries($userId: ID!) {
      listItineraries(userId: $userId) {
        items {
          id
          destination
          startDate
          endDate
          createdAt
        }
      }
    }
  `,
  GET_ITINERARY: `
    query GetItinerary($id: ID!) {
      getItinerary(id: $id) {
        id
        destination
        startDate
        endDate
        days {
          date
          blocks {
            start
            end
            title
            category
            costBand
            notes
            address
            lat
            lon
          }
        }
        packingList
        rationalePerDay
      }
    }
  `,
};

export const mutations = {
  // TODO: Add actual GraphQL mutations
  UPSERT_PROFILE: `
    mutation UpsertProfile($input: ProfileInput!) {
      upsertProfile(input: $input) {
        id
        interests
        travelStyle
        budget
        constraints
      }
    }
  `,
  GENERATE_ITINERARY: `
    mutation GenerateItinerary($input: GenerateItineraryInput!) {
      generateItinerary(input: $input) {
        id
        destination
        startDate
        endDate
        days {
          date
          blocks {
            start
            end
            title
            category
            costBand
            notes
            address
            lat
            lon
          }
        }
        packingList
        rationalePerDay
      }
    }
  `,
  RATE_ACTIVITY: `
    mutation RateActivity($input: RateActivityInput!) {
      rateActivity(input: $input) {
        success
        message
      }
    }
  `,
};
