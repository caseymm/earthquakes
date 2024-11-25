import AWS from 'aws-sdk';
import playwright from 'playwright';
import shp from 'shpjs';
import simplify from '@turf/simplify';
import gp from 'geojson-precision';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// The name of the bucket that you have created
const BUCKET_NAME = 'caseymm-earthquakes';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ID,
  secretAccessKey: process.env.AWS_SECRET
});

async function uploadFile(name, data, ext) {
  // Setting up S3 upload parameters
  const params = {
      Bucket: BUCKET_NAME,
      Key: `${name}.${ext}`, // File name you want to save as in S3
      Body: data,
      Metadata: {
        'Cache-Control': 'no-cache',
      }
  };

  // Uploading files to the bucket
  s3.upload(params, function(err, data) {
      if (err) {
          throw err;
      }
      console.log(`File uploaded successfully. ${data.Location}`);
      return data.Location;
  });
};

async function convertShapefile(url, magnitude) {
  let options = {tolerance: 0.001, highQuality: false};
  // if(magnitude < 3){
  //   options.tolerance = 0.005;
  // }
  const geojson = await shp(url);
  const mi = geojson.find(obj => obj.fileName === 'mi');
  const simplified = simplify(mi, options);
  const smaller = gp(simplified, 4);
  return smaller;
}

async function useTheData(id){
  // this is where screenshot stuff goes
  const browser = await playwright['chromium'].launch();
  const context = await browser.newContext({
    deviceScaleFactor: 2
  });
  let isBlank = false;
  const page = await context.newPage();
  await page.setViewportSize({ width: 800, height: 800 });
  console.log(`https://caseymm.github.io/mbx-earthquakes/?url=https://caseymm-earthquakes.s3.us-west-1.amazonaws.com/shakemaps/${id}.geojson`)
  await page.goto(`https://caseymm.github.io/mbx-earthquakes/?url=https://caseymm-earthquakes.s3.us-west-1.amazonaws.com/shakemaps/${id}.geojson`);
  try{
    const sel = await page.waitForSelector('#hidden', {state: 'attached'});
    if(await sel.textContent() === 'blank map'){
      isBlank = true;
    }
  } catch(err){
    // try again
    await delay(5000) // waiting 5 seconds
    console.log(`https://caseymm.github.io/mbx-earthquakes/?url=https://caseymm-earthquakes.s3.us-west-1.amazonaws.com/shakemaps/${id}.geojson`)
    await page.goto(`https://caseymm.github.io/mbx-earthquakes/?url=https://caseymm-earthquakes.s3.us-west-1.amazonaws.com/shakemaps/${id}.geojson`);
    const sel = await page.waitForSelector('#hidden', {state: 'attached'});
    if(await sel.textContent() === 'blank map'){
      isBlank = true;
    }
  }
  if(isBlank){
    await browser.close();
    return null;
  } else {
    // only take the screenshot if it's not blank water
    const screenshot = await page.screenshot();
    await uploadFile(`shakemaps/${id}`, screenshot, 'png');
    await browser.close();
    return screenshot;
  }
}

export { uploadFile, convertShapefile, useTheData }