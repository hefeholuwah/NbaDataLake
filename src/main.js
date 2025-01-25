require('dotenv').config();
const axios = require('axios');
const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();
const glue = new AWS.Glue();
const athena = new AWS.Athena();

async function fetchSportsData() {
  try {
    const apiKey = process.env.SPORTS_API_KEY;
    const url = 'https://api.sportsdata.io/v3/nba/scores/json/PlayersActiveBasic';

    const response = await axios.get(url, {
      headers: { 'Ocp-Apim-Subscription-Key': apiKey },
    });

    console.log('API data fetched successfully');
    return response.data;
  } catch (error) {
    console.error('Error fetching API data:', error.message);
    throw error;
  }
}

async function uploadToS3(data) {
  const bucketName = 'nbadatalake';
  const fileName = `sportsdata-${Date.now()}.json`;

  const params = {
    Bucket: bucketName,
    Key: fileName,
    Body: JSON.stringify(data),
    ContentType: 'application/json',
  };

  try {
    const uploadResult = await s3.upload(params).promise();
    console.log('File uploaded to S3:', uploadResult.Location);
    return uploadResult.Location;
  } catch (error) {
    console.error('Error uploading to S3:', error.message);
    throw error;
  }
}

async function createGlueCrawler() {
  const crawlerName = 'sportsdata-crawler';
  const databaseName = 'sportsdata_db';
  const tablePrefix = 'sports_';
  const s3Path = 's3://nbadatalake/';
  const glueRoleArn = process.env.GLUE_ROLE_ARN;

  try {
    // Create Glue Database
    await glue
      .createDatabase({
        DatabaseInput: {
          Name: databaseName,
          Description: 'Database for sports data',
        },
      })
      .promise();
    console.log(`Database "${databaseName}" created successfully`);

    // Create Crawler
    await glue
      .createCrawler({
        Name: crawlerName,
        Role: glueRoleArn,
        DatabaseName: databaseName,
        Targets: { S3Targets: [{ Path: s3Path }] },
        TablePrefix: tablePrefix,
      })
      .promise();
    console.log(`Crawler "${crawlerName}" created successfully`);

    // Start Crawler
    await glue.startCrawler({ Name: crawlerName }).promise();
    console.log(`Crawler "${crawlerName}" started successfully`);

    // Wait for crawler to complete
    await waitForCrawlerCompletion(crawlerName);
  } catch (error) {
    console.error('Error creating Glue crawler or database:', error.message);
    throw error;
  }
}

async function waitForCrawlerCompletion(crawlerName) {
  let status = '';
  do {
    const crawlerInfo = await glue.getCrawler({ Name: crawlerName }).promise();
    status = crawlerInfo.Crawler.State;
    console.log(`Crawler state: ${status}`);
    if (status === 'RUNNING') {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Poll every 10 seconds
    }
  } while (status === 'RUNNING');
  console.log('Crawler execution completed.');
}

async function queryAthena() {
  const params = {
    QueryString: 'SELECT * FROM "sportsdata_db"."sports_nbadatalake" LIMIT 10;',
    QueryExecutionContext: { Database: 'sportsdata_db' },
    ResultConfiguration: { OutputLocation: 's3://nbadatalake/athena-results/' },
  };

  try {
    const queryExecution = await athena.startQueryExecution(params).promise();
    console.log('Athena query started successfully:', queryExecution.QueryExecutionId);

    // Wait for query to complete
    await waitForQueryCompletion(queryExecution.QueryExecutionId);

    // Fetch Query Results
    const resultParams = { QueryExecutionId: queryExecution.QueryExecutionId };
    const queryResults = await athena.getQueryResults(resultParams).promise();
    console.log('Athena Query Results:', JSON.stringify(queryResults, null, 2));
  } catch (error) {
    console.error('Error executing Athena query:', error.message);
    throw error;
  }
}

async function waitForQueryCompletion(queryExecutionId) {
  let state = '';
  do {
    const execution = await athena.getQueryExecution({ QueryExecutionId: queryExecutionId }).promise();
    state = execution.QueryExecution.Status.State;
    console.log(`Athena query state: ${state}`);
    if (state === 'RUNNING' || state === 'QUEUED') {
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Poll every 5 seconds
    }
  } while (state === 'RUNNING' || state === 'QUEUED');
  if (state !== 'SUCCEEDED') {
    throw new Error(`Athena query failed with state: ${state}`);
  }
}

// Main
(async () => {
  try {
    const data = await fetchSportsData();
    const s3Upload = await uploadToS3(data);
    console.log('Data uploaded to S3 at:', s3Upload);
    await createGlueCrawler();
    await queryAthena();
  } catch (error) {
    console.error('Error in processing:', error.message);
  }
})();
