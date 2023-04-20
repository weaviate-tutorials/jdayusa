// Simple proxy server to protect the OpenAI API key from exposure on the client.
// Adds the OpenAI API key to every request from the client, and returns the response from Weaviate.
// Based on https://github.com/chimurai/http-proxy-middleware
import { config } from './config';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

// Create Express server
const app = express();

// Configuration
const PORT = 3000;
app.use('/', createProxyMiddleware({
  target: 'https://' + config.host,
  changeOrigin: true,  // required; "needed for virtual hosted sites"
  headers: {
    'Authorization': 'Bearer ' + config.weaviateApiKey,
    'X-OpenAI-Api-Key': config.openAiApiKey,
  },
  onProxyReq: function (proxyReq) {
    // log headers; body is complicated - https://stackoverflow.com/questions/50294807/log-request-responses-bodies-with-http-proxy-middleware
    console.info(proxyReq.getHeaders());
  }
}));

// Start the Proxy
app.listen(PORT, 'localhost', () => {
  console.log(`Proxy server listening on port ${PORT}`);
});
