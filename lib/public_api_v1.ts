/**
 * Main entrypoint for the public APIs handlers
 */
import { getRequiredStringEnv } from "./utils/env";

import { IContext } from "azure-function-express";

import * as winston from "winston";

import * as ApplicationInsights from "applicationinsights";

import { setAppContext } from "./utils/middlewares/context_middleware";

import { configureAzureContextTransport } from "./utils/logging";

import { DocumentClient as DocumentDBClient } from "documentdb";

import * as documentDbUtils from "./utils/documentdb";

import { createAzureFunctionHandler } from "azure-function-express";

import { MessageModel } from "./models/message";
import { NotificationModel } from "./models/notification";
import { ProfileModel } from "./models/profile";
import { ServiceModel } from "./models/service";

import { GetDebug } from "./controllers/debug";
import { GetInfo } from "./controllers/info";
import { CreateMessage, GetMessage, GetMessages } from "./controllers/messages";
import { GetProfile, UpsertProfile } from "./controllers/profiles";

import * as express from "express";
import { secureExpressApp } from "./utils/express";

import { createBlobService } from "azure-storage";

// Whether we're in a production environment
const isProduction = process.env.NODE_ENV === "production";

// Setup Express
const app = express();
secureExpressApp(app);

// Setup DocumentDB

const cosmosDbUri = getRequiredStringEnv("CUSTOMCONNSTR_COSMOSDB_URI");
const cosmosDbKey = getRequiredStringEnv("CUSTOMCONNSTR_COSMOSDB_KEY");
const cosmosDbName = getRequiredStringEnv("COSMOSDB_NAME");
const messageContainerName = getRequiredStringEnv("MESSAGE_CONTAINER_NAME");

const documentDbDatabaseUrl = documentDbUtils.getDatabaseUri(cosmosDbName);
const messagesCollectionUrl = documentDbUtils.getCollectionUri(
  documentDbDatabaseUrl,
  "messages"
);
const profilesCollectionUrl = documentDbUtils.getCollectionUri(
  documentDbDatabaseUrl,
  "profiles"
);
const servicesCollectionUrl = documentDbUtils.getCollectionUri(
  documentDbDatabaseUrl,
  "services"
);
const notificationsCollectionUrl = documentDbUtils.getCollectionUri(
  documentDbDatabaseUrl,
  "notifications"
);

const documentClient = new DocumentDBClient(cosmosDbUri, {
  masterKey: cosmosDbKey
});

const profileModel = new ProfileModel(documentClient, profilesCollectionUrl);
const messageModel = new MessageModel(
  documentClient,
  messagesCollectionUrl,
  messageContainerName
);
const serviceModel = new ServiceModel(documentClient, servicesCollectionUrl);
const notificationModel = new NotificationModel(
  documentClient,
  notificationsCollectionUrl
);

const storageConnectionString = getRequiredStringEnv("QueueStorageConnection");
const blobService = createBlobService(storageConnectionString);

// Setup ApplicationInsights

const appInsightsClient = new ApplicationInsights.TelemetryClient();

// Setup handlers

const debugHandler = GetDebug(serviceModel);
app.get("/api/v1/debug", debugHandler);
app.post("/api/v1/debug", debugHandler);

app.get("/api/v1/profiles/:fiscalcode", GetProfile(serviceModel, profileModel));
app.post(
  "/api/v1/profiles/:fiscalcode",
  UpsertProfile(serviceModel, profileModel)
);

app.get(
  "/api/v1/messages/:fiscalcode/:id",
  GetMessage(serviceModel, messageModel, notificationModel, blobService)
);
app.get(
  "/api/v1/messages/:fiscalcode",
  GetMessages(serviceModel, messageModel)
);
app.post(
  "/api/v1/messages/:fiscalcode",
  CreateMessage(appInsightsClient, serviceModel, messageModel)
);

app.get("/api/v1/info", GetInfo(serviceModel));

const azureFunctionHandler = createAzureFunctionHandler(app);

// Binds the express app to an Azure Function handler
export function index(context: IContext<{}>): void {
  const logLevel = isProduction ? "info" : "debug";
  configureAzureContextTransport(context, winston, logLevel);
  setAppContext(app, context);
  azureFunctionHandler(context);
}
