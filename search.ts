import { config } from "./config";
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

    let query = req.query.search;
    console.info('Searching for:', query);
    let limit = 5;

    const nearTextResult = await client.graphql
        .get()
        .withClassName('Session')
        .withFields('speaker title description url')
        .withNearText({ concepts: [query] })
        .withLimit(5)
        .do();

    // Log for debugging
    console.log('nearText:', JSON.stringify(nearTextResult.data['Get']['Session'], null, 2));

    // Return the sessions to the rendering engine
    res.json(nearTextResult.data['Get']['Session']);
});

let server = app.listen(PORT, function() {
    console.log(`Search server listening on port ${PORT}`);
});