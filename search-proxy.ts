import { config } from './config';
import express from 'express';
import weaviate, { ApiKey } from 'weaviate-ts-client';

const app = express();

const PORT = 3000;

const client = weaviate.client({
  scheme: 'https',
  host: config.host,
  apiKey: new ApiKey(config.weaviateApiKey),
  headers: {'X-OpenAI-Api-Key': config.openAiApiKey},
});

app.get('/', async function(req, res) {

  const query = req.query.search;
  console.info('Searching for:', query);

  const nearTextResult = await client.graphql
    .get()
    .withClassName('Session')
    .withFields('speaker title description url')
    .withNearText({ concepts: [query] })
    .withLimit(5)
    .do();

  // Return the sessions as the JSON response
  res.json(nearTextResult.data['Get']['Session']);
});

app.listen(PORT, function() {
  console.log(`Search server listening on port ${PORT}`);
});
