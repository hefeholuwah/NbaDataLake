# Sports Data Integration with AWS  

This project fetches sports player data from the SportsData API, processes it, stores it in an AWS S3 data lake, and enables querying through AWS Glue and Athena. The system automates data ingestion, processing, and querying for analytics and reporting purposes.



## Features  
- **API Integration**: Fetch player data from the SportsData API.  
- **S3 Data Lake**: Store JSON data in an S3 bucket.  
- **AWS Glue Crawler**: Automatically create a table for querying data.  
- **AWS Athena Queries**: Query the data using SQL-like syntax.  
- **Automated Workflow**: Fully automated workflow from fetching data to querying results.

---

## Prerequisites  

### AWS Services  
- **S3**: A bucket to store sports data and query results.  
- **Glue**: A database and crawler for managing schema and data.  
- **Athena**: For running queries on the data lake.  
- **IAM Role**: An IAM role with permissions to access S3, Glue, and Athena.  

### Environment  
1. **Node.js** (v16 or later).  
2. A `.env` file with the following:  

```plaintext
AWS_ACCESS_KEY_ID=your_aws_access_key_id  
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key  
AWS_REGION=your_aws_region  
SPORTS_API_KEY=your_sportsdata_api_key  
GLUE_ROLE_ARN=your_glue_role_arn  
```

3. Install dependencies:  

```bash
npm install
```

---

## How It Works  

### Workflow  
1. **Data Fetching**: The `fetchSportsData` function pulls player data from the SportsData API.  
2. **S3 Upload**: The JSON data is uploaded to an S3 bucket using the `uploadToS3` function.  
3. **Glue Crawler**: The `createGlueCrawler` function creates a Glue database and crawler to structure the data.  
4. **Athena Query**: The `queryAthena` function allows querying the data stored in the data lake.  

## Usage  

1. **Fetch and Process Data**  
Run the script to fetch data, upload it to S3, create a Glue crawler, and query it in Athena:  

```bash
node index.js
```

2. **Querying Data**  
Athena allows querying the processed data. Use the query:  

```sql
SELECT * FROM "sportsdata_db"."sports_playersactivebasic" LIMIT 10;
```

The query results are saved in the specified S3 output location.  

---

## Customization  

### S3 Bucket  
Update the `bucketName` in the `uploadToS3` function to your preferred bucket name.  

### Glue Crawler  
Modify the `createGlueCrawler` function to update the database name, table prefix, or S3 path.  

### Athena Query  
Customize the SQL query in `queryAthena` to suit your needs.  

---

## Troubleshooting  

### Common Issues  
1. **Table Not Found**:  
   Ensure the Glue crawler has finished running and created the table.  

2. **Permissions**:  
   Check the IAM role for required permissions on S3, Glue, and Athena.  

3. **Invalid Data**:  
   Verify the JSON structure matches the schema expected by Glue.  

### Logs  
Monitor the logs for detailed error messages:  
- API errors: Ensure the `SPORTS_API_KEY` is valid.  
- S3 errors: Ensure the bucket name and permissions are correct.  
- Glue errors: Check the crawler's role and database configurations.  

---

## License  
This project is licensed under the MIT License.  

## Acknowledgments  
- [SportsData API](https://sportsdata.io) for the player data.  
- AWS Services for seamless data processing and querying.  

--- 

Feel free to tweak this README as needed! Let me know if you'd like to add anything specific.