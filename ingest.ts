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
  class: "Session",
  description: "An JDayUSA 2023 session",
  vectorizer: "text2vec-openai",
  moduleConfig: {
    'text2vec-openai': {
      model: 'davinci',
      modelVersion: '003',  // TODO: replace with GPT, https://github.com/weaviate/weaviate/issues/2715
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
      moduleConfig: { 'text2vec-openai': { skip: true } },
    },
  ]
}

// Add the Session class to the schema
await client.schema.classCreator().withClass(sessionClass).do();
console.log('Created schema. Importing data...');

// ===== Import data =====
// Return whether a session has already been imported. Used to avoid creating duplicates.
async function exists(sessionUrl: string): Promise<boolean> {
  const result = await client.graphql
      .get()
      .withClassName('Session')
      .withFields('url')  // we don't really need any field, but one is required
      .withWhere({
        path: ['url'],
        operator: 'Equal',
        valueString: sessionUrl,
      })
      .withLimit(1)
      .do();
  return result.data.Get.Session.length > 0;
}

let potentialErrors = 0;
async function importData() {
  const batchSize = 50;
  let batcher = client.batch.objectsBatcher();
  let counter = 0;

  async function importBatch() {
    try {
      const response = await batcher.do();
      // Check for vectorizer errors like "OpenAI API Key: no api key found" or "Rate limit reached"
      const error = response.find(r => r.result.errors?.error[0]?.message);
      if (error) {
        potentialErrors++;
        throw new Error(error.result.errors.error[0].message);
      }
      console.log(`Imported ${response.length} objects.`);
    } catch (e) {
      console.error(e.message);
    }
  }

  for (const s of sessions) {
    const obj = {
      class: 'Session',
      properties: s,
    };
    // Add the object to the batch queue if it hasn't been imported already
    if (!await exists(s.url)) {
      batcher = batcher.withObject(obj);
      counter++;
    }
    if (counter >= batchSize) {
      await importBatch();
      batcher = client.batch.objectsBatcher();
      counter = 0;
    }
  }
  // Import the last batch
  await importBatch();
}

// Import the sessions
await importData();
if (potentialErrors)
  console.log('Some object were skipped during import. Re-run until no new objects have been imported.');
else
  console.log('Import finished.');
