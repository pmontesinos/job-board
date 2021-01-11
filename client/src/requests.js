import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from 'apollo-boost';
import gql from 'graphql-tag';
import { getAccessToken, isLoggedIn } from './auth';

const endpointURL = 'http://localhost:9000/graphql';

const authLink = new ApolloLink((operation, forward) => {
  // forward allows us to chain
  if (isLoggedIn()) {
    operation.setContext({
      headers: {
        'authorization': 'Bearer ' + getAccessToken()
      }
    })
  }
  return forward(operation);
});

const client = new ApolloClient({
  // ApolloLink.from takes array of link instances and combines them together
  // first, authLink is ran, then the HttpLink
  link: ApolloLink.from([
    authLink,
    new HttpLink({uri: endpointURL})
  ]),
  cache: new InMemoryCache()
});

// Job is type
const jobDetailFragment = gql`
  fragment JobDetail on Job {
    id
    title
    company {
      id
      name
    }
    description
  }
`;

const companyQuery = gql`
  query CompanyQuery($id: ID!) {
    company(id:$id) {
      id
      name
      description,
      jobs {
        id
        title
      }
    }
  }
`;
// JobDetail inside of createJob() is value of jobDetailFragment
const createJobMutation = gql`
  mutation CreateJob($input: CreateJobInput) {
    job: createJob(input: $input) {
      ...JobDetail
    }
  }
  ${jobDetailFragment}
`;

const jobQuery = gql`
  query JobQuery($id: ID!) {
    job(id: $id) {
      ...JobDetail
    }
  }
  ${jobDetailFragment}
`;

const jobsQuery = gql`
  query JobsQuery
    {
      jobs {
        id
        title,
        company {
          id
          name
        }
      }
    }
`;

export async function createJob(input) {

  // const { job } = await graphqlRequest(mutation, {input});
  const {data: {job}} = await client.mutate({
    mutation: createJobMutation,
    variables: {input},
    // whenever you run this mutation, take the data returned in the response
    // and save it to the cache as if it was the result of running the JobQuery
    // for that specific job id. This way, if we run a job query w/that job id,
    // it will find the data in the cache and avoid making a new call to the server
    // In other words, if we create a new job, there will only be one api call, not two
    // Previously, there had been two to load the job
    // update method updates cache
    update: (cache, {data}) => {
      cache.writeQuery({
        query: jobQuery,
        variables: {id: data.job.id},
        data
      })
    }
  });
  return job;
}

export async function loadCompany(id) {
  // const { company } = await graphqlRequest(query, {id});
  const { data: {company}} = await client.query({query: companyQuery, variables: {id}});
  return company;
}

export async function loadJobs() {
  const { data: { jobs } } = await client.query({query: jobsQuery, fetchPolicy: 'no-cache'});
  return jobs;
}

export async function loadJob(id) {
  // const { job } = await graphqlRequest(query, {id});
  const { data: { job }} = await client.query({query: jobQuery, variables: {id}});
  return job;
}
