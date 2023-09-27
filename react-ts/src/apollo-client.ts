import { ApolloClient, InMemoryCache } from "@apollo/client";

const cache = new InMemoryCache();

export const client = new ApolloClient({
  cache,
  uri: "/api/",
  queryDeduplication: false,
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "cache-and-network",
    },
  },
});
