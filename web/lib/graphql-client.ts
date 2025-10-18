import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
// import { Auth } from 'aws-amplify';

// TODO: Replace with actual AppSync configuration
const httpLink = createHttpLink({
  uri: process.env.APPSYNC_GRAPHQL_ENDPOINT || 'your_graphql_endpoint',
});

// TODO: Implement auth when Amplify is configured
const authLink = setContext(async (_, { headers }) => {
  // try {
  //   const session = await Auth.currentSession();
  //   const token = session.getIdToken().getJwtToken();
  //   return {
  //     headers: {
  //       ...headers,
  //       authorization: token ? `Bearer ${token}` : '',
  //     },
  //   };
  // } catch (error) {
  //   console.error('Error getting JWT token:', error);
  //   return {
  //     headers: {
  //       ...headers,
  //     },
  //   };
  // }
  return {
    headers: {
      ...headers,
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
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
