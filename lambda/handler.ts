import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'eu-north-1' });
const TABLE_NAME = process.env.TABLE_NAME || 'MyTable';

// Default CORS headers for API Gateway responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // Adjust this to your domain in production
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Log the incoming event for debugging
  console.log('Received event:', JSON.stringify(event, null, 2));

  try {
    // Handle CORS preflight (OPTIONS) request
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: '',
      };
    }

    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'POST': {
        // Parse the request body
        const body = event.body ? JSON.parse(event.body) : null;
        if (!body || !body.id || !body.data) {
          return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'Missing id or data in request body' }),
          };
        }

        // Write to DynamoDB
        const putCommand = new PutItemCommand({
          TableName: TABLE_NAME,
          Item: marshall({ id: body.id, data: body.data }),
        });
        await client.send(putCommand);

        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ message: `Item ${body.id} created successfully` }),
        };
      }

      case 'GET': {
        // Get the 'id' from query string parameters
        const id = event.queryStringParameters?.id;
        if (!id) {
          return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'Missing id in query string' }),
          };
        }

        // Read from DynamoDB
        const getCommand = new GetItemCommand({
          TableName: TABLE_NAME,
          Key: marshall({ id }),
        });
        const response = await client.send(getCommand);

        if (!response.Item) {
          return {
            statusCode: 404,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: `Item ${id} not found` }),
          };
        }

        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify(unmarshall(response.Item)),
        };
      }

      default: {
        return {
          statusCode: 405,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: `Method ${event.httpMethod} not allowed` }),
        };
      }
    }
  } catch (error) {
    // Log the error for debugging
    console.error('Error:', error);

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    };
  }
};