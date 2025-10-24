"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../backend/functions/generateItinerary.ts
var generateItinerary_exports = {};
__export(generateItinerary_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(generateItinerary_exports);
var import_client_dynamodb = require("@aws-sdk/client-dynamodb");
var import_lib_dynamodb = require("@aws-sdk/lib-dynamodb");
var import_client_bedrock_runtime = require("@aws-sdk/client-bedrock-runtime");
var dynamoDB = import_lib_dynamodb.DynamoDBDocumentClient.from(new import_client_dynamodb.DynamoDBClient({}));
var bedrock = new import_client_bedrock_runtime.BedrockRuntimeClient({ region: "us-east-1" });
async function handler(event) {
  try {
    const userId = event.requestContext.authorizer?.claims.sub;
    if (!userId) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Unauthorized" })
      };
    }
    const body = JSON.parse(event.body || "{}");
    const prompt = `Generate a ${body.duration}-day travel itinerary for ${body.destination}.

User preferences:
- Interests: ${body.interests?.join(", ") || "general sightseeing"}
- Budget: ${body.budget || "medium"}
- Start date: ${body.startDate || "flexible"}

Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
{
  "destination": "${body.destination}",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "blocks": [
        {
          "id": "unique-id",
          "start": "09:00",
          "end": "11:00",
          "title": "Activity name",
          "category": "food",
          "costBand": "med",
          "notes": "Why visit",
          "address": "Full address"
        }
      ]
    }
  ],
  "packingList": ["item1", "item2"],
  "rationalePerDay": ["Day 1: Reason", "Day 2: Reason"]
}`;
    const response = await bedrock.send(
      new import_client_bedrock_runtime.InvokeModelCommand({
        modelId: "anthropic.claude-3-sonnet-20240229-v1:0",
        contentType: "application/json",
        body: JSON.stringify({
          anthropic_version: "bedrock-2023-05-31",
          max_tokens: 4096,
          temperature: 0.7,
          messages: [{ role: "user", content: prompt }]
        })
      })
    );
    const result = JSON.parse(new TextDecoder().decode(response.body));
    const content = result.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Bedrock response");
    }
    const itinerary = JSON.parse(jsonMatch[0]);
    const id = `ITIN-${Date.now()}`;
    const item = {
      PK: `USER#${userId}`,
      SK: `ITIN#${id}`,
      id,
      userId,
      ...itinerary,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await dynamoDB.send(
      new import_lib_dynamodb.PutCommand({
        TableName: process.env.TABLE_NAME,
        Item: item
      })
    );
    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(item)
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to generate itinerary" })
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
