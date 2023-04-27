import { config } from './config';
import weaviate, { ApiKey } from 'weaviate-ts-client';
import sessions from './sessions.json' assert { type: 'json' };

const client = weaviate.client({
  scheme: 'https',
  host: config.host,
  apiKey: new ApiKey(config.weaviateApiKey),
  headers: {'X-OpenAI-Api-Key': config.openAiApiKey},
});

// Start from scratch by deleting all Sessions if the class exists
try {
  await client.schema.classDeleter().withClassName('Session').do();
  console.log('Deleted existing Sessions');
} catch (e) {
  if (!e.message.match(/could not find class/))
    throw e;
}

// ===== Create the Session class for the schema =====
const sessionClass = {
  class: 'Session',
  description: 'An JDayUSA 2023 session',
  vectorizer: 'text2vec-openai',
  moduleConfig: {
    'text2vec-openai': {
      model: 'davinci',
      modelVersion: '003',
      type: 'text',
      vectorizeClassName: false
    }
  },
  properties: [
    {
      name: 'speaker',
      description: 'Name of the session speaker',
      dataType: [ 'string' ],
      // Vectorize the speaker's name as well, to allow for typos
    },
    {
      name: 'title',
      description: 'The title of the session',
      dataType: [ 'string' ],
    },
    {
      name: 'description',
      description: 'The description of the session, from the individual session page',
      dataType: [ 'text' ],
    },
    {
      name: 'url',
      dataType: ['string'],
      description: 'Absolute link to the session',
      // Don't vectorize the URL
      moduleConfig: { 'text2vec-openai': { skip: true } },
    },
  ]
};

async function importData() {
  const batchSize = 50;
  let batcher = client.batch.objectsBatcher();
  let counter = 0;

  for (const s of sessions) {
    const obj = {
      class: 'Session',
      properties: s,
    };

    // Add the object to the batch queue if it hasn't been imported already
    batcher = batcher.withObject(obj);
    counter++;

    if (counter >= batchSize) {
      // Run the batch import
      const response = await batcher.do();
      console.log(`Imported ${response.length} objects.`);
      // Restart the batch
      batcher = client.batch.objectsBatcher();
      counter = 0;
    }
  }
  // Import the last batch
  const response = await batcher.do();
  console.log(`Imported ${response.length} objects.`);
}

// Add the Session class to the schema
await client.schema.classCreator().withClass(sessionClass).do();
console.log('Created schema. Importing data...');

// Import the sessions
await importData();
