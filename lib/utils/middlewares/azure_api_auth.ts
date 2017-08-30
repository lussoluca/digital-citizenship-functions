/*
 * A middle ware that extracts authentication information from the
 * request.
 */

import * as jsYaml from "js-yaml";
import { none, option, Option, some } from "ts-option";

import { left, right } from "../either";

import { IRetrievedOrganization, OrganizationModel } from "../../models/organization";
import { IRequestMiddleware } from "../request_middleware";
import { IResponseErrorForbidden, ResponseErrorForbidden } from "../response";
import { isModelId, ModelId } from "../versioned_model";

interface IUserAttributes {
  organizationId?: string;
}

export interface IAzureApiAuthorization {
  kind: "IAzureApiAuthorization";
  groups: string[];
  organization?: IRetrievedOrganization;
}

/**
 * Returns an array of group names from a groups header.
 *
 * Expects a comma separated list of group names.
 */
function getGroupsFromHeader(groupsHeader: string): string[] {
  return groupsHeader.split(",")
    .filter((g) => g.match(/^[0-9a-zA-Z-_]+$/));
}

/**
 * Attempts to fetch the Organization associated to the user in the
 * user custom attributes.
 */
function getUserOrganization(
  organizationModel: OrganizationModel,
  userAttributes: IUserAttributes,
): Promise<Option<IRetrievedOrganization>> {
  return option(userAttributes.organizationId)
    .flatMap<ModelId>((maybeOrganizationId) => {
      if (maybeOrganizationId !== undefined && isModelId(maybeOrganizationId)) {
        return some(maybeOrganizationId);
      } else {
        return none;
      }
    }).map((organizationId) => {
      return organizationModel.findLastVersionById(organizationId)
        .then((result) => {
          if (result !== null) {
            return some(result);
          } else {
            return none;
          }
        });
    }).getOrElse(() => Promise.resolve(none));
}

/**
 * A middleware that will extract the Azure API Management authentication
 * information from the request.
 *
 * The middleware expects the following headers:
 *
 *   x-user-groups:   A comma separated list of names of Azure API Groups
 *   x-user-note:     The Note field associated to the user (URL encoded
 *                    using .NET Uri.EscapeUriString().
 *
 * The Note field is optional, and when defined is expected to be a YAML data
 * structure providing the following attributes associated to the authenticated
 * user:
 *
 *   organizationId:  The identifier of the organization of this user (optional)
 *
 * On success, the middleware generates an IAzureApiAuthorization, on failure
 * it triggers a ResponseErrorForbidden.
 *
 */
export function AzureApiAuthMiddleware(
  organizationModel: OrganizationModel,
): IRequestMiddleware<IResponseErrorForbidden, IAzureApiAuthorization> {
  return (request) => new Promise((resolve, reject) => {
    // to correctly process the request, we must associate the correct
    // authorizations to the user that made the request; to do so, we
    // need to extract the groups associated to the authenticated user
    // from the x-user-groups header, generated by the Azure API Management
    // proxy.
    option(request.header("x-user-groups"))
      .map(getGroupsFromHeader) // extract the groups from the header
      .filter((hs) => hs.length > 0) // filter only if array of groups is non empty
      .map((groups) => {
        // now we have some groups
        // TODO: map to group types

        // now we check whether some custom user attributes have been set
        // through the x-user-note header (filled from the User Note attribute)
        const userAttributes = option(request.header("x-user-note"))
          // the header is a URI encoded string (since it may contain new lines
          // and special chars), so we must first decode it.
          .map(decodeURIComponent)
          .flatMap<IUserAttributes>((y) => {
            // then we try to parse the YAML string
            try {
              // all IUserAttributes are optional, so we can safely cast
              // the object to it
              const yaml = jsYaml.safeLoad(y) as IUserAttributes;
              return some(yaml);
            } catch (e) {
              return none;
            }
          });

        // now we can attempt to retrieve the Organization associated to the
        // user, in case it was set in the custom attribute
        const userOrg: Promise<Option<IRetrievedOrganization>> = new Promise((orgResolve, orgReject) => {
          userAttributes
            .map((a) => {
              getUserOrganization(organizationModel, a)
                .then(orgResolve, orgReject);
            })
            .getOrElse(() => orgResolve(none));
        });

        userOrg.then((o) => {
          // we have everything we need, we can now resolve the outer
          // promise with an IAzureApiAuthorization object

          const authInfo: IAzureApiAuthorization = {
            groups,
            kind: "IAzureApiAuthorization",
            organization: o.orNull,
          };

          resolve(right(authInfo));
        }, reject);
      }).getOrElse(() => {
        // or else no valid groups
        resolve(left(ResponseErrorForbidden("User has no associated groups.")));
      });

  });
}
