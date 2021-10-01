import fetch from 'node-fetch';
import { convertShapefile, uploadFile } from './actions.js';

async function getLatestEarthquakes(){

  let metadata = [];

  const metadataFileUrl = `https://caseymm-earthquakes.s3.amazonaws.com/shakemaps/metadata.json`;
  const metadataRespLatest = await fetch(metadataFileUrl);
  const metadataLatest = await metadataRespLatest.json();

  const earthquakes = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_hour.geojson`;
  // const earthquakes = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson';
  const resp = await fetch(earthquakes);
  const data = await resp.json();

  for(const q in data.features){
    const quake = data.features[q];
    const detailUrl = quake.properties.detail;
    const id = detailUrl.replace('.geojson', '').split('/').slice(-1)[0];

    if(metadataLatest.find(obj => obj.id === id && obj.geojsonUrl)){
      // if we already have the geojson, push it back in so that we keep knowing we have it
      console.log('already uploaded');
      metadata.push(metadataLatest.find(obj => obj.id === id && obj.geojsonUrl));
    } else {
      // if we haven't already gotten the geojson for this quake
      // console.log(id)
      const response = await fetch(detailUrl);
      const detailData = await response.json();
      const magnitude = detailData.properties.mag;
      const location = detailData.properties.place;
      let tmp = {
        id: id,
        detailUrl: detailUrl,
        magnitude: magnitude,
        location: location,
        date: new Date(detailData.properties.time),
        hasMap: false
      }
      try{
        const shapeUrl = detailData.properties.products.shakemap[0]['contents']['download/shape.zip']['url'];
        const geojson = await convertShapefile(shapeUrl, magnitude);
        const uploaded = await uploadFile(`shakemaps/${id}`, JSON.stringify(geojson), 'geojson');
        tmp.geojsonUrl = `https://caseymm-earthquakes.s3-us-west-1.amazonaws.com/shakemaps/${id}.geojson`;
        console.log('has shape');
      } catch(err){
        console.log('no shape');
        tmp.geojsonUrl = null;
      }
      metadata.push(tmp);
    }
    if(q == data.features.length - 1){
      console.log('uploading metadata')
      console.log(metadata)
      await uploadFile(`shakemaps/metadata`, JSON.stringify(metadata), 'json');
    }
  }
  
}

getLatestEarthquakes();


