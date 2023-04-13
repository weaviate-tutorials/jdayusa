// Config file. In addition to this, index.html uses process.env.GRAPHQL_URL (dev vs. prod server)
import 'dotenv/config';
export const config = {
  filename: 'sessions.json',
  host: process.env.WEAVIATE_HOST,
  weaviateApiKey: process.env.WEAVIATE_API_KEY,
  openAiApiKey: process.env.OPENAI_APIKEY,
};
