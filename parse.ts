// Parse the sessions from https://jdayusa.com/sessions into sessions.json
import { config } from './config';
import * as cheerio from 'cheerio';
import got from 'got';
import { writeFileSync } from 'fs';

const base = 'https://jdayusa.com/';

const sessions = [];

// Load the sessions page
const url = `${base}sessions`;
const response = await got(url).text();
const $ = cheerio.load(response);

// Parse session details from the page
$('div.newsinfo').each((index, session) => {
  const speaker = $(session).find('.detail_author .detail_data').text();
  const title = $(session).find('.newstitle a').text().trim();
  const link = $(session).find('.newstitle a').attr('href');
  const excerpt = $(session).find('.newsintro').text().trim();
  sessions.push({ speaker, title, url: base + link, excerpt });
});

// Get the full session description from each individual session page, one by one to avoid hammering
for (const session of sessions) {
  const response = await got(session.url).text();
  const $ = cheerio.load(response);
  session.description = $('div[itemProp=articleBody] p').toArray().map(e => $(e).text()).join(' ').trim();

  console.log(`# ${session.speaker} - [${session.title}](${session.url})\n\n${session.excerpt}\n\n${session.description}\n\n------\n\n`);
}

writeFileSync(config.filename, JSON.stringify(sessions, null, 4));
console.log(`Dumped ${sessions.length} sessions to ${config.filename}`);
