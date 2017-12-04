import * as DocumentDb from "documentdb";
import * as DocumentDbUtils from "./documentdb";
import { DocumentDbModel } from "./documentdb_model";

import * as t from "io-ts";

import {
  fromNullable,
  isNone,
  none,
  Option,
  some,
  Some
} from "fp-ts/lib/Option";

import { NonNegativeNumber } from "./numbers";

import { Either, isLeft, right } from "fp-ts/lib/Either";

interface IModelIdTag {
  readonly kind: "IModelIdTag";
}

export type ModelId = string & IModelIdTag;

/**
 * Type guard for numbers that are non-negative.
 */
export function isModelId(s: string): s is ModelId {
  return typeof s === "string" && s.length > 0;
}

// tslint:disable-next-line:no-any
export function toModelId(s: any): Option<ModelId> {
  return fromNullable(s).filter(isModelId);
}

/**
 * A VersionedModel should track the version of the model
 */
export interface IVersionedModel {
  readonly version: NonNegativeNumber;
}

/**
 * Returns a string with a composite id that has the format:
 * MODEL_ID-VERSION
 *
 * MODEL_ID is the base model ID
 * VERSION is the zero-padded version of the model
 *
 * @param modelId The base model ID
 * @param version The version of the model
 */
export function generateVersionedModelId(
  modelId: ModelId,
  version: NonNegativeNumber
): string {
  const paddingLength = 16; // length of Number.MAX_SAFE_INTEGER == 9007199254740991
  const paddedVersion = ("0".repeat(paddingLength) + version).slice(
    -paddingLength
  );
  return `${modelId}-${paddedVersion}`;
}

export abstract class DocumentDbModelVersioned<
  T,
  TN extends T & DocumentDb.NewDocument & IVersionedModel,
  TR extends T & DocumentDb.RetrievedDocument & IVersionedModel
> extends DocumentDbModel<T, TN, TR> {
  protected getModelId: (o: T) => ModelId;

  protected versionateModel: (
    o: T,
    id: string,
    version: NonNegativeNumber
  ) => TN;

  public async create(
    document: T,
    partitionKey: string
  ): Promise<Either<DocumentDb.QueryError, TR>> {
    // the first version of a profile is 0
    const initialVersion = (t.validate(0, NonNegativeNumber).toOption() as Some<
      NonNegativeNumber
    >).value;
    // the ID of each document version is composed of the document ID and its version
    // this makes it possible to detect conflicting updates (concurrent creation of
    // profiles with the same profile ID and version)
    const modelId = this.getModelId(document);
    const versionedModelId = generateVersionedModelId(modelId, initialVersion);

    // spread over generic type doesn't work yet, waiting for
    // https://github.com/Microsoft/TypeScript/pull/13288
    // const newDocument = {
    //   ...document,
    //   id: versionedModelId,
    //   version: initialVersion,
    // };

    const newDocument = this.versionateModel(
      document,
      versionedModelId,
      initialVersion
    );

    return super.create(newDocument, partitionKey);
  }

  public async update(
    objectId: string,
    partitionKey: string,
    f: (current: T) => T
  ): Promise<Either<DocumentDb.QueryError, Option<TR>>> {
    // fetch the document
    const errorOrMaybeCurrent = await this.find(objectId, partitionKey);
    if (isLeft(errorOrMaybeCurrent)) {
      // if the query returned an error, forward it
      return errorOrMaybeCurrent;
    }

    const maybeCurrent = errorOrMaybeCurrent.value;

    if (isNone(maybeCurrent)) {
      return right(maybeCurrent);
    }

    const currentRetrievedDocument = maybeCurrent.value;
    const currentObject = this.toBaseType(currentRetrievedDocument);

    const updatedObject = f(currentObject);

    const modelId = this.getModelId(updatedObject);
    const nextVersion = (t
      .validate(currentRetrievedDocument.version + 1, NonNegativeNumber)
      .toOption() as Some<NonNegativeNumber>).value;
    const versionedModelId = generateVersionedModelId(modelId, nextVersion);

    const newDocument = this.versionateModel(
      updatedObject,
      versionedModelId,
      nextVersion
    );

    const createdDocument = await super.create(newDocument, partitionKey);

    return createdDocument.map(some);
  }

  protected async findLastVersionByModelId<V>(
    collectionName: string,
    modelIdField: string,
    modelIdValue: V
  ): Promise<Either<DocumentDb.QueryError, Option<TR>>> {
    const errorOrMaybeDocument = await DocumentDbUtils.queryOneDocument(
      this.dbClient,
      this.collectionUri,
      {
        parameters: [
          {
            name: "@modelId",
            value: modelIdValue
          }
        ],
        query: `SELECT * FROM ${collectionName} m WHERE (m.${modelIdField} = @modelId) ORDER BY m.version DESC`
      }
    );

    if (
      isLeft(errorOrMaybeDocument) &&
      errorOrMaybeDocument.value.code === 404
    ) {
      // if the error is 404 (Not Found), we return an empty value
      return right(none);
    }

    return errorOrMaybeDocument.map(maybeDocument =>
      maybeDocument.map(this.toRetrieved)
    );
  }
}
