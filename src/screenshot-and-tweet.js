import fetch from 'node-fetch';
import { BskyAgent } from '@atproto/api';
import { uploadFile, useTheData } from './actions.js';
import dateFormat from 'dateformat';

const agent = new BskyAgent({
  service: 'https://bsky.social',
})

async function uploadImageToBsky(fileBuffer) {
  try {
      const { data } = await agent.uploadBlob(fileBuffer, { encoding:'image/jpeg'} )
      return data.blob;
  } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
  }
}

async function login() {
  try {
      await agent.login({ 
          identifier: process.env.BLUESKY_USERNAME, 
          password: process.env.BLUESKY_PASSWORD 
      });
      console.log("Logged in successfully!");
  } catch (error) {
      console.error("Error logging in:", error);
      throw error;
  }
}

async function screenshotAndTweet(){
  let metadata = [];
  const metadataFileUrl = `https://caseymm-earthquakes.s3.amazonaws.com/shakemaps/metadata.json`;
  const metadataRespLatest = await fetch(metadataFileUrl);
  const metadataLatest = await metadataRespLatest.json();

  // console.log(metadataLatest)
  for(const q in metadataLatest){
    const quake = metadataLatest[q];
    const dateStr = dateFormat(quake.date, "mmmm dS, yyyy");
    const timeStr = dateFormat(quake.date, "h:MM:ss TT");
    if(quake.hasMap){
      // add it back to the array
      metadata.push(quake);
    } else if(quake.geojsonUrl){
      // technically haven't created the map, but if it fails it is too late anyway
      quake.hasMap = true;
      metadata.push(quake);
      useTheData(quake.id).then(img => {
        if(img){

          uploadImageToBsky(img).then(result => {
            agent.post({
              text: `A magnitude ${quake.magnitude} earthquake occurred ${quake.location} on ${dateStr} at ${timeStr} GMT\n\nhttps://earthquake.usgs.gov/earthquakes/eventpage/${quake.id}`,
              embed: {
                  $type:'app.bsky.embed.images',
                  images: [{ 
                    alt: `Shakemap for the magnitude ${quake.magnitude} earthquake mentioned in this post.`,
                    image: result 
                  }],
              }
            });
          })
         
        } 
      });
    } else {
      metadata.push(quake);
    }
    console.log(q, metadataLatest.length - 1)
    if(q == metadataLatest.length - 1){
      console.log('uploading metadata')
      console.log(metadata)
      await uploadFile(`shakemaps/metadata`, JSON.stringify(metadata), 'json');
    }
  }
  
}

// Initialize the agent and login once
(async () => {
  try {
      await login(); // Login once at the start
      screenshotAndTweet();
  } catch (error) {
      console.error("Error during initialization:", error);
  }
})();