import fetch from 'node-fetch';
import twitter from 'twitter-lite';
import { useTheData } from './actions.js';

const client = new twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,  
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,  
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,  
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const uploadClient = new twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,  
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,  
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,  
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  subdomain: "upload"
});

async function screenshotAndTweet(){
  const folder = 'shakemaps';
  const color = 'e60000';
  let message = '';

  let metadata = [];

  const metadataFileUrl = `https://caseymm-earthquakes.s3.amazonaws.com/shakemaps/metadata.json`;
  const metadataRespLatest = await fetch(metadataFileUrl);
  const metadataLatest = await metadataRespLatest.json();

  // useTheData(folder, color).then(img => {
  //   uploadClient.post('media/upload', { media_data: img.toString('base64') }).then(result => {
  //     if(messageArray.length === 0){
  //       const status = {
  //         status: message,
  //         media_ids: result.media_id_string
  //       }
  //       client.post('statuses/update', status).then(result => {
  //         console.log('You successfully tweeted this : "' + result.text + '"');
  //       }).catch(console.error);
  //     }
  //   }).catch(console.error);
  // });
}

screenshotAndTweet();