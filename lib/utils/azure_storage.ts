/**
 * Utility functions to interact with an Azure Blob Storage.
 */
import * as azureStorage from "azure-storage";
import { Either, left, right } from "fp-ts/lib/Either";
import { fromNullable, Option } from "fp-ts/lib/Option";

/**
 * Create a new blob (media) from plain text.
 * Assumes that the container <containerName> already exists.
 *
 * @param blobService     the Azure blob service
 * @param containerName   the name of the Azure blob storage container
 * @param blobName        blob storage container name
 * @param text            text to be saved
 */
export function upsertBlobFromText(
  blobService: azureStorage.BlobService,
  containerName: string,
  blobName: string,
  text: string | Buffer
): Promise<Either<Error, Option<azureStorage.BlobService.BlobResult>>> {
  return new Promise(resolve =>
    blobService.createBlockBlobFromText(
      containerName,
      blobName,
      text,
      (err, result, __) => {
        if (err) {
          return resolve(
            left<Error, Option<azureStorage.BlobService.BlobResult>>(err)
          );
        } else {
          return resolve(
            right<Error, Option<azureStorage.BlobService.BlobResult>>(
              fromNullable(result)
            )
          );
        }
      }
    )
  );
}

/**
 * Create a new blob (media) from a typed object.
 * Assumes that the container <containerName> already exists.
 *
 * @param blobService     the Azure blob service
 * @param containerName   the name of the Azure blob storage container
 * @param blobName        blob storage container name
 * @param content         object to be serialized and saved
 */
export function upsertBlobFromObject<T>(
  blobService: azureStorage.BlobService,
  containerName: string,
  blobName: string,
  content: T
): Promise<Either<Error, Option<azureStorage.BlobService.BlobResult>>> {
  return upsertBlobFromText(
    blobService,
    containerName,
    blobName,
    JSON.stringify(content)
  );
}

/**
 * Get a blob content as text (string).
 *
 * @param blobService     the Azure blob service
 * @param containerName   the name of the Azure blob storage container
 * @param blobName        blob file name
 */
export function getBlobAsText(
  blobService: azureStorage.BlobService,
  containerName: string,
  blobName: string
): Promise<Either<Error, Option<string>>> {
  return new Promise(resolve => {
    blobService.getBlobToText(containerName, blobName, (err, result, __) => {
      if (err) {
        return resolve(left<Error, Option<string>>(err));
      } else {
        return resolve(right<Error, Option<string>>(fromNullable(result)));
      }
    });
  });
}
