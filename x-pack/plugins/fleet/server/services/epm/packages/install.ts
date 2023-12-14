/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import apm from 'elastic-apm-node';
import { i18n } from '@kbn/i18n';
import semverLt from 'semver/functions/lt';
import type Boom from '@hapi/boom';
import type {
  ElasticsearchClient,
  SavedObject,
  SavedObjectsClientContract,
  Logger,
} from '@kbn/core/server';
import { SavedObjectsErrorHelpers } from '@kbn/core/server';

import { DEFAULT_SPACE_ID } from '@kbn/spaces-plugin/common/constants';

import pRetry from 'p-retry';

import { uniqBy } from 'lodash';

import type { LicenseType } from '@kbn/licensing-plugin/server';

import type { PackageDataStreamTypes } from '../../../../common/types';

import type { HTTPAuthorizationHeader } from '../../../../common/http_authorization_header';

import { isPackagePrerelease, getNormalizedDataStreams } from '../../../../common/services';

import { FLEET_INSTALL_FORMAT_VERSION } from '../../../constants/fleet_es_assets';

import { generateESIndexPatterns } from '../elasticsearch/template/template';

import type {
  ArchivePackage,
  BulkInstallPackageInfo,
  EpmPackageInstallStatus,
  EsAssetReference,
  InstallablePackage,
  Installation,
  InstallResult,
  InstallSource,
  InstallType,
  KibanaAssetType,
  NewPackagePolicy,
  PackageInfo,
  PackageVerificationResult,
  RegistryDataStream,
} from '../../../types';
import {
  AUTO_UPGRADE_POLICIES_PACKAGES,
  CUSTOM_INTEGRATION_PACKAGE_SPEC_VERSION,
  DATASET_VAR_NAME,
} from '../../../../common/constants';
import {
  FleetError,
  PackageOutdatedError,
  PackagePolicyValidationError,
  ConcurrentInstallOperationError,
  FleetUnauthorizedError,
  PackageInvalidArchiveError,
  PackageNotFoundError,
} from '../../../errors';
import { PACKAGES_SAVED_OBJECT_TYPE, MAX_TIME_COMPLETE_INSTALL } from '../../../constants';
import { dataStreamService, licenseService } from '../..';
import { appContextService } from '../../app_context';
import * as Registry from '../registry';
import {
  setPackageInfo,
  generatePackageInfoFromArchiveBuffer,
  unpackBufferToCache,
  deleteVerificationResult,
  getArchiveFilelist,
} from '../archive';
import { toAssetReference } from '../kibana/assets/install';
import type { ArchiveAsset } from '../kibana/assets/install';

import type { PackageUpdateEvent } from '../../upgrade_sender';
import { sendTelemetryEvents, UpdateEventType } from '../../upgrade_sender';

import { prepareToInstallPipelines } from '../elasticsearch/ingest_pipeline';

import { prepareToInstallTemplates } from '../elasticsearch/template/install';

import { auditLoggingService } from '../../audit_logging';

import { getFilteredInstallPackages } from '../filtered_packages';

import { formatVerificationResultForSO } from './package_verification';

import { getInstallation, getInstallationObject } from '.';
import { removeInstallation } from './remove';
import { getPackageSavedObjects } from './get';
import { _installPackage } from './_install_package';
import { removeOldAssets } from './cleanup';
import { getBundledPackageByPkgKey } from './bundled_packages';
import { withPackageSpan } from './utils';
import { convertStringToTitle, generateDescription } from './custom_integrations/utils';
import { INITIAL_VERSION } from './custom_integrations/constants';
import { createAssets } from './custom_integrations';
import { cacheAssets } from './custom_integrations/assets/cache';
import { generateDatastreamEntries } from './custom_integrations/assets/dataset/utils';
import { checkForNamingCollision } from './custom_integrations/validation/check_naming_collision';
import { checkDatasetsNameFormat } from './custom_integrations/validation/check_dataset_name_format';
import { addErrorToLatestFailedAttempts } from './install_errors_helpers';

export async function isPackageInstalled(options: {
  savedObjectsClient: SavedObjectsClientContract;
  pkgName: string;
}): Promise<boolean> {
  const installedPackage = await getInstallation(options);
  return installedPackage !== undefined;
}

export async function isPackageVersionOrLaterInstalled(options: {
  savedObjectsClient: SavedObjectsClientContract;
  pkgName: string;
  pkgVersion: string;
}): Promise<{ package: Installation; installType: InstallType } | false> {
  const { savedObjectsClient, pkgName, pkgVersion } = options;
  const installedPackageObject = await getInstallationObject({ savedObjectsClient, pkgName });
  const installedPackage = installedPackageObject?.attributes;
  if (
    installedPackage &&
    (installedPackage.version === pkgVersion || semverLt(pkgVersion, installedPackage.version))
  ) {
    let installType: InstallType;
    try {
      installType = getInstallType({ pkgVersion, installedPkg: installedPackageObject });
    } catch (e) {
      installType = 'unknown';
    }
    return { package: installedPackage, installType };
  }
  return false;
}

export async function ensureInstalledPackage(options: {
  savedObjectsClient: SavedObjectsClientContract;
  pkgName: string;
  esClient: ElasticsearchClient;
  pkgVersion?: string;
  spaceId?: string;
  force?: boolean;
  authorizationHeader?: HTTPAuthorizationHeader | null;
}): Promise<Installation> {
  const {
    savedObjectsClient,
    pkgName,
    esClient,
    pkgVersion,
    force = false,
    spaceId = DEFAULT_SPACE_ID,
    authorizationHeader,
  } = options;

  // If pkgVersion isn't specified, find the latest package version
  const pkgKeyProps = pkgVersion
    ? { name: pkgName, version: pkgVersion }
    : await Registry.fetchFindLatestPackageOrThrow(pkgName, { prerelease: true });

  const installedPackageResult = await isPackageVersionOrLaterInstalled({
    savedObjectsClient,
    pkgName: pkgKeyProps.name,
    pkgVersion: pkgKeyProps.version,
  });
  if (installedPackageResult) {
    return installedPackageResult.package;
  }
  const pkgkey = Registry.pkgToPkgKey(pkgKeyProps);
  const installResult = await installPackage({
    installSource: 'registry',
    savedObjectsClient,
    pkgkey,
    spaceId,
    esClient,
    neverIgnoreVerificationError: !force,
    force: true, // Always force outdated packages to be installed if a later version isn't installed
    authorizationHeader,
  });

  if (installResult.error) {
    const errorPrefix =
      installResult.installType === 'update' || installResult.installType === 'reupdate'
        ? i18n.translate('xpack.fleet.epm.install.packageUpdateError', {
            defaultMessage: 'Error updating {pkgName} to {pkgVersion}',
            values: {
              pkgName: pkgKeyProps.name,
              pkgVersion: pkgKeyProps.version,
            },
          })
        : i18n.translate('xpack.fleet.epm.install.packageInstallError', {
            defaultMessage: 'Error installing {pkgName} {pkgVersion}',
            values: {
              pkgName: pkgKeyProps.name,
              pkgVersion: pkgKeyProps.version,
            },
          });
    installResult.error.message = `${errorPrefix}: ${installResult.error.message}`;
    throw installResult.error;
  }

  const installation = await getInstallation({ savedObjectsClient, pkgName });
  if (!installation) throw new FleetError(`Could not get installation for ${pkgName}`);
  return installation;
}

export async function handleInstallPackageFailure({
  savedObjectsClient,
  error,
  pkgName,
  pkgVersion,
  installedPkg,
  esClient,
  spaceId,
  authorizationHeader,
}: {
  savedObjectsClient: SavedObjectsClientContract;
  error: FleetError | Boom.Boom | Error;
  pkgName: string;
  pkgVersion: string;
  installedPkg: SavedObject<Installation> | undefined;
  esClient: ElasticsearchClient;
  spaceId: string;
  authorizationHeader?: HTTPAuthorizationHeader | null;
}) {
  if (error instanceof ConcurrentInstallOperationError) {
    return;
  }
  const logger = appContextService.getLogger();
  const pkgkey = Registry.pkgToPkgKey({
    name: pkgName,
    version: pkgVersion,
  });

  const latestInstallFailedAttempts = addErrorToLatestFailedAttempts({
    error,
    targetVersion: pkgVersion,
    createdAt: new Date().toISOString(),
    latestAttempts: installedPkg?.attributes.latest_install_failed_attempts,
  });

  // if there is an unknown server error, uninstall any package assets or reinstall the previous version if update
  try {
    const installType = getInstallType({ pkgVersion, installedPkg });
    if (installType === 'install') {
      logger.error(`uninstalling ${pkgkey} after error installing: [${error.toString()}]`);
      await removeInstallation({ savedObjectsClient, pkgName, pkgVersion, esClient });
      return;
    }

    await updateInstallStatusToFailed({
      logger,
      savedObjectsClient,
      pkgName,
      status: 'install_failed',
      latestInstallFailedAttempts,
    });

    if (installType === 'reinstall') {
      logger.error(`Failed to reinstall ${pkgkey}: [${error.toString()}]`, { error });
    }

    if (installType === 'update') {
      if (!installedPkg) {
        logger.error(
          `failed to rollback package after installation error ${error} because saved object was undefined`
        );
        return;
      }
      const prevVersion = `${pkgName}-${installedPkg.attributes.version}`;
      logger.error(`rolling back to ${prevVersion} after error installing ${pkgkey}`);
      await installPackage({
        installSource: 'registry',
        savedObjectsClient,
        pkgkey: prevVersion,
        esClient,
        spaceId,
        force: true,
        authorizationHeader,
      });
    }
  } catch (e) {
    // If an error happens while removing the integration or while doing a rollback update the status to failed
    await updateInstallStatusToFailed({
      logger,
      savedObjectsClient,
      pkgName,
      status: 'install_failed',
      latestInstallFailedAttempts: installedPkg
        ? addErrorToLatestFailedAttempts({
            error: e,
            targetVersion: installedPkg.attributes.version,
            createdAt: installedPkg.attributes.install_started_at,
            latestAttempts: latestInstallFailedAttempts,
          })
        : [],
    });
    logger.error(`failed to uninstall or rollback package after installation error ${e}`);
  }
}

export interface IBulkInstallPackageError {
  name: string;
  error: Error;
  installType?: InstallType;
}
export type BulkInstallResponse = BulkInstallPackageInfo | IBulkInstallPackageError;

interface InstallRegistryPackageParams {
  savedObjectsClient: SavedObjectsClientContract;
  pkgkey: string;
  esClient: ElasticsearchClient;
  spaceId: string;
  force?: boolean;
  neverIgnoreVerificationError?: boolean;
  ignoreConstraints?: boolean;
  prerelease?: boolean;
  authorizationHeader?: HTTPAuthorizationHeader | null;
  ignoreMappingUpdateErrors?: boolean;
  skipDataStreamRollover?: boolean;
}

export interface CustomPackageDatasetConfiguration {
  name: string;
  type: PackageDataStreamTypes;
}
interface InstallCustomPackageParams {
  savedObjectsClient: SavedObjectsClientContract;
  pkgName: string;
  datasets: CustomPackageDatasetConfiguration[];
  esClient: ElasticsearchClient;
  spaceId: string;
  force?: boolean;
  authorizationHeader?: HTTPAuthorizationHeader | null;
  kibanaVersion: string;
}
interface InstallUploadedArchiveParams {
  savedObjectsClient: SavedObjectsClientContract;
  esClient: ElasticsearchClient;
  archiveBuffer: Buffer;
  contentType: string;
  spaceId: string;
  version?: string;
  authorizationHeader?: HTTPAuthorizationHeader | null;
  ignoreMappingUpdateErrors?: boolean;
  skipDataStreamRollover?: boolean;
  isBundledPackage?: boolean;
}

function getTelemetryEvent(pkgName: string, pkgVersion: string): PackageUpdateEvent {
  return {
    packageName: pkgName,
    currentVersion: 'unknown',
    newVersion: pkgVersion,
    status: 'failure',
    dryRun: false,
    eventType: UpdateEventType.PACKAGE_INSTALL,
    installType: 'unknown',
  };
}

function sendEvent(telemetryEvent: PackageUpdateEvent) {
  sendTelemetryEvents(
    appContextService.getLogger(),
    appContextService.getTelemetryEventsSender(),
    telemetryEvent
  );
}

async function installPackageFromRegistry({
  savedObjectsClient,
  pkgkey,
  esClient,
  spaceId,
  authorizationHeader,
  force = false,
  ignoreConstraints = false,
  neverIgnoreVerificationError = false,
  prerelease = false,
  ignoreMappingUpdateErrors = false,
  skipDataStreamRollover = false,
}: InstallRegistryPackageParams): Promise<InstallResult> {
  const logger = appContextService.getLogger();
  // TODO: change epm API to /packageName/version so we don't need to do this
  const { pkgName, pkgVersion: version } = Registry.splitPkgKey(pkgkey);
  let pkgVersion = version ?? '';

  // if an error happens during getInstallType, report that we don't know
  let installType: InstallType = 'unknown';
  const installSource = 'registry';
  const telemetryEvent: PackageUpdateEvent = getTelemetryEvent(pkgName, pkgVersion);

  try {
    // get the currently installed package
    const installedPkg = await getInstallationObject({ savedObjectsClient, pkgName });
    installType = getInstallType({ pkgVersion, installedPkg });

    telemetryEvent.installType = installType;
    telemetryEvent.currentVersion = installedPkg?.attributes.version || 'not_installed';

    const queryLatest = () =>
      Registry.fetchFindLatestPackageOrThrow(pkgName, {
        ignoreConstraints,
        prerelease: prerelease === true || isPackagePrerelease(pkgVersion), // fetching latest GA version if the package to install is GA, so that it is allowed to install
      });

    let latestPkg;
    // fetching latest package first to set the version
    if (!pkgVersion) {
      latestPkg = await queryLatest();
      pkgVersion = latestPkg.version;
    }

    // get latest package version and requested version in parallel for performance
    const [latestPackage, { paths, packageInfo, verificationResult }] = await Promise.all([
      latestPkg ? Promise.resolve(latestPkg) : queryLatest(),
      Registry.getPackage(pkgName, pkgVersion, {
        ignoreUnverified: force && !neverIgnoreVerificationError,
      }),
    ]);

    // let the user install if using the force flag or needing to reinstall or install a previous version due to failed update
    const installOutOfDateVersionOk =
      force || ['reinstall', 'reupdate', 'rollback'].includes(installType);

    // if the requested version is out-of-date of the latest package version, check if we allow it
    // if we don't allow it, return an error
    if (semverLt(pkgVersion, latestPackage.version)) {
      if (!installOutOfDateVersionOk) {
        throw new PackageOutdatedError(
          `${pkgkey} is out-of-date and cannot be installed or updated`
        );
      }
      logger.debug(
        `${pkgkey} is out-of-date, installing anyway due to ${
          force ? 'force flag' : `install type ${installType}`
        }`
      );
    }

    return await installPackageCommon({
      pkgName,
      pkgVersion,
      installSource,
      installedPkg,
      installType,
      savedObjectsClient,
      esClient,
      spaceId,
      force,
      packageInfo,
      paths,
      verificationResult,
      authorizationHeader,
      ignoreMappingUpdateErrors,
      skipDataStreamRollover,
    });
  } catch (e) {
    sendEvent({
      ...telemetryEvent,
      errorMessage: e.message,
    });
    return {
      error: e,
      installType,
      installSource,
    };
  }
}

function getElasticSubscription(packageInfo: ArchivePackage) {
  const subscription = packageInfo.conditions?.elastic?.subscription as LicenseType | undefined;
  // Keep packageInfo.license for backward compatibility
  return subscription || packageInfo.license || 'basic';
}

async function installPackageCommon(options: {
  pkgName: string;
  pkgVersion: string;
  installSource: InstallSource;
  installedPkg?: SavedObject<Installation>;
  installType: InstallType;
  savedObjectsClient: SavedObjectsClientContract;
  esClient: ElasticsearchClient;
  spaceId: string;
  force?: boolean;
  packageInfo: ArchivePackage;
  paths: string[];
  verificationResult?: PackageVerificationResult;
  telemetryEvent?: PackageUpdateEvent;
  authorizationHeader?: HTTPAuthorizationHeader | null;
  ignoreMappingUpdateErrors?: boolean;
  skipDataStreamRollover?: boolean;
}): Promise<InstallResult> {
  const {
    pkgName,
    pkgVersion,
    installSource,
    installedPkg,
    installType,
    savedObjectsClient,
    force,
    esClient,
    spaceId,
    packageInfo,
    paths,
    verificationResult,
    authorizationHeader,
    ignoreMappingUpdateErrors,
    skipDataStreamRollover,
  } = options;
  let { telemetryEvent } = options;
  const logger = appContextService.getLogger();
  logger.info(`Install - Starting installation of ${pkgName}@${pkgVersion} from ${installSource} `);

  // Workaround apm issue with async spans: https://github.com/elastic/apm-agent-nodejs/issues/2611
  await Promise.resolve();
  const span = apm.startSpan(
    `Install package from ${installSource} ${pkgName}@${pkgVersion}`,
    'package'
  );

  if (!telemetryEvent) {
    telemetryEvent = getTelemetryEvent(pkgName, pkgVersion);
    telemetryEvent.installType = installType;
    telemetryEvent.currentVersion = installedPkg?.attributes.version || 'not_installed';
  }

  try {
    span?.addLabels({
      packageName: pkgName,
      packageVersion: pkgVersion,
      installType,
    });

    const filteredPackages = getFilteredInstallPackages();
    if (filteredPackages.includes(pkgName)) {
      throw new FleetUnauthorizedError(`${pkgName} installation is not authorized`);
    }

    // if the requested version is the same as installed version, check if we allow it based on
    // current installed package status and force flag, if we don't allow it,
    // just return the asset references from the existing installation
    if (
      installedPkg?.attributes.version === pkgVersion &&
      installedPkg?.attributes.install_status === 'installed'
    ) {
      if (!force) {
        logger.debug(`${pkgName}-${pkgVersion} is already installed, skipping installation`);
        return {
          assets: [
            ...installedPkg.attributes.installed_es,
            ...installedPkg.attributes.installed_kibana,
          ],
          status: 'already_installed',
          installType,
          installSource,
        };
      }
    }
    const elasticSubscription = getElasticSubscription(packageInfo);
    if (!licenseService.hasAtLeast(elasticSubscription)) {
      logger.error(`Installation requires ${elasticSubscription} license`);
      const err = new FleetError(`Installation requires ${elasticSubscription} license`);
      sendEvent({
        ...telemetryEvent,
        errorMessage: err.message,
      });
      return { error: err, installType, installSource };
    }

    const savedObjectsImporter = appContextService
      .getSavedObjects()
      .createImporter(savedObjectsClient, { importSizeLimit: 15_000 });

    const savedObjectTagAssignmentService = appContextService
      .getSavedObjectsTagging()
      .createInternalAssignmentService({ client: savedObjectsClient });

    const savedObjectTagClient = appContextService
      .getSavedObjectsTagging()
      .createTagClient({ client: savedObjectsClient });

    // try installing the package, if there was an error, call error handler and rethrow
    // @ts-expect-error status is string instead of InstallResult.status 'installed' | 'already_installed'
    return await _installPackage({
      savedObjectsClient,
      savedObjectsImporter,
      savedObjectTagAssignmentService,
      savedObjectTagClient,
      esClient,
      logger,
      installedPkg,
      paths,
      packageInfo,
      installType,
      spaceId,
      verificationResult,
      installSource,
      authorizationHeader,
      force,
      ignoreMappingUpdateErrors,
      skipDataStreamRollover,
    })
      .then(async (assets) => {
        logger.debug(`Removing old assets from previous versions of ${pkgName}`);
        await removeOldAssets({
          soClient: savedObjectsClient,
          pkgName: packageInfo.name,
          currentVersion: packageInfo.version,
        });
        sendEvent({
          ...telemetryEvent!,
          status: 'success',
        });
        return { assets, status: 'installed', installType, installSource };
      })
      .catch(async (err: Error) => {
        logger.warn(`Failure to install package [${pkgName}]: [${err.toString()}]`, {
          error: { stack_trace: err.stack },
        });
        await handleInstallPackageFailure({
          savedObjectsClient,
          error: err,
          pkgName,
          pkgVersion,
          installedPkg,
          spaceId,
          esClient,
          authorizationHeader,
        });
        sendEvent({
          ...telemetryEvent!,
          errorMessage: err.message,
        });
        return { error: err, installType, installSource };
      });
  } catch (e) {
    sendEvent({
      ...telemetryEvent,
      errorMessage: e.message,
    });
    return {
      error: e,
      installType,
      installSource,
    };
  } finally {
    span?.end();
  }
}

async function installPackageByUpload({
  savedObjectsClient,
  esClient,
  archiveBuffer,
  contentType,
  spaceId,
  version,
  authorizationHeader,
  ignoreMappingUpdateErrors,
  skipDataStreamRollover,
  isBundledPackage,
}: InstallUploadedArchiveParams): Promise<InstallResult> {
  // if an error happens during getInstallType, report that we don't know
  let installType: InstallType = 'unknown';
  const installSource = isBundledPackage ? 'bundled' : 'upload';
  try {
    const { packageInfo } = await generatePackageInfoFromArchiveBuffer(archiveBuffer, contentType);
    const pkgName = packageInfo.name;

    // Allow for overriding the version in the manifest for cases where we install
    // stack-aligned bundled packages to support special cases around the
    // `forceAlignStackVersion` flag in `fleet_packages.json`.
    const pkgVersion = version || packageInfo.version;

    const installedPkg = await getInstallationObject({
      savedObjectsClient,
      pkgName,
    });

    installType = getInstallType({ pkgVersion, installedPkg });

    // as we do not verify uploaded packages, we must invalidate the verification cache
    deleteVerificationResult(packageInfo);
    const paths = await unpackBufferToCache({
      name: packageInfo.name,
      version: pkgVersion,
      archiveBuffer,
      contentType,
    });

    setPackageInfo({
      name: packageInfo.name,
      version: pkgVersion,
      packageInfo,
    });

    return await installPackageCommon({
      pkgName,
      pkgVersion,
      installSource,
      installedPkg,
      installType,
      savedObjectsClient,
      esClient,
      spaceId,
      force: true, // upload has implicit force
      packageInfo,
      paths,
      authorizationHeader,
      ignoreMappingUpdateErrors,
      skipDataStreamRollover,
    });
  } catch (e) {
    return {
      error: e,
      installType,
      installSource,
    };
  }
}

export type InstallPackageParams = {
  spaceId: string;
  neverIgnoreVerificationError?: boolean;
} & (
  | ({ installSource: Extract<InstallSource, 'registry'> } & InstallRegistryPackageParams)
  | ({ installSource: Extract<InstallSource, 'upload'> } & InstallUploadedArchiveParams)
  | ({ installSource: Extract<InstallSource, 'bundled'> } & InstallUploadedArchiveParams)
  | ({ installSource: Extract<InstallSource, 'custom'> } & InstallCustomPackageParams)
);

export async function installPackage(args: InstallPackageParams): Promise<InstallResult> {
  if (!('installSource' in args)) {
    throw new FleetError('installSource is required');
  }

  const logger = appContextService.getLogger();
  const { savedObjectsClient, esClient } = args;

  const authorizationHeader = args.authorizationHeader;

  if (args.installSource === 'registry') {
    const {
      pkgkey,
      force,
      ignoreConstraints,
      spaceId,
      neverIgnoreVerificationError,
      prerelease,
      ignoreMappingUpdateErrors,
      skipDataStreamRollover,
    } = args;

    const matchingBundledPackage = await getBundledPackageByPkgKey(pkgkey);

    if (matchingBundledPackage) {
      logger.debug(
        `Found bundled package for requested install of ${pkgkey} - installing from bundled package archive`
      );

      const archiveBuffer = await matchingBundledPackage.getBuffer();

      const response = await installPackageByUpload({
        savedObjectsClient,
        esClient,
        archiveBuffer,
        contentType: 'application/zip',
        spaceId,
        version: matchingBundledPackage.version,
        authorizationHeader,
        ignoreMappingUpdateErrors,
        skipDataStreamRollover,
        isBundledPackage: true,
      });

      return { ...response, installSource: 'bundled' };
    }

    logger.debug(`Kicking off install of ${pkgkey} from registry`);
    const response = await installPackageFromRegistry({
      savedObjectsClient,
      pkgkey,
      esClient,
      spaceId,
      force,
      neverIgnoreVerificationError,
      ignoreConstraints,
      prerelease,
      authorizationHeader,
      ignoreMappingUpdateErrors,
      skipDataStreamRollover,
    });
    return response;
  } else if (args.installSource === 'upload') {
    const {
      archiveBuffer,
      contentType,
      spaceId,
      ignoreMappingUpdateErrors,
      skipDataStreamRollover,
    } = args;
    logger.debug(`Installing package by upload`);
    const response = await installPackageByUpload({
      savedObjectsClient,
      esClient,
      archiveBuffer,
      contentType,
      spaceId,
      authorizationHeader,
      ignoreMappingUpdateErrors,
      skipDataStreamRollover,
    });
    return response;
  } else if (args.installSource === 'custom') {
    const { pkgName, force, datasets, spaceId, kibanaVersion } = args;
    logger.debug(`Kicking off install of custom package ${pkgName}`);
    const response = await installCustomPackage({
      savedObjectsClient,
      pkgName,
      datasets,
      esClient,
      spaceId,
      force,
      authorizationHeader,
      kibanaVersion,
    });
    return response;
  }
  throw new FleetError(`Unknown installSource: ${args.installSource}`);
}

export async function installCustomPackage(
  args: InstallCustomPackageParams
): Promise<InstallResult> {
  const {
    savedObjectsClient,
    esClient,
    spaceId,
    pkgName,
    force,
    authorizationHeader,
    datasets,
    kibanaVersion,
  } = args;

  // Validate that we can create this package, validations will throw if they don't pass
  await checkForNamingCollision(savedObjectsClient, pkgName);
  checkDatasetsNameFormat(datasets, pkgName);

  // Compose a packageInfo
  const packageInfo = {
    format_version: CUSTOM_INTEGRATION_PACKAGE_SPEC_VERSION,
    name: pkgName,
    title: convertStringToTitle(pkgName),
    description: generateDescription(datasets.map((dataset) => dataset.name)),
    version: INITIAL_VERSION,
    owner: { github: authorizationHeader?.username ?? 'unknown' },
    type: 'integration' as const,
    data_streams: generateDatastreamEntries(datasets, pkgName),
  };

  const assets = createAssets({
    ...packageInfo,
    kibanaVersion,
    datasets,
  });

  const paths = cacheAssets(assets, pkgName, INITIAL_VERSION);

  return await installPackageCommon({
    pkgName,
    pkgVersion: INITIAL_VERSION,
    installSource: 'custom',
    installType: 'install',
    savedObjectsClient,
    esClient,
    spaceId,
    force,
    packageInfo,
    paths,
    authorizationHeader,
  });
}

export const updateVersion = async (
  savedObjectsClient: SavedObjectsClientContract,
  pkgName: string,
  pkgVersion: string
) => {
  auditLoggingService.writeCustomSoAuditLog({
    action: 'update',
    id: pkgName,
    savedObjectType: PACKAGES_SAVED_OBJECT_TYPE,
  });

  return savedObjectsClient.update(PACKAGES_SAVED_OBJECT_TYPE, pkgName, {
    version: pkgVersion,
  });
};

export const updateInstallStatusToFailed = async ({
  logger,
  savedObjectsClient,
  pkgName,
  status,
  latestInstallFailedAttempts,
}: {
  logger: Logger;
  savedObjectsClient: SavedObjectsClientContract;
  pkgName: string;
  status: EpmPackageInstallStatus;
  latestInstallFailedAttempts: any;
}) => {
  auditLoggingService.writeCustomSoAuditLog({
    action: 'update',
    id: pkgName,
    savedObjectType: PACKAGES_SAVED_OBJECT_TYPE,
  });
  try {
    return await savedObjectsClient.update(PACKAGES_SAVED_OBJECT_TYPE, pkgName, {
      install_status: status,
      latest_install_failed_attempts: latestInstallFailedAttempts,
    });
  } catch (err) {
    if (!SavedObjectsErrorHelpers.isNotFoundError(err)) {
      logger.error(`failed to update package status to: install_failed  ${err}`);
    }
  }
};

export async function restartInstallation(options: {
  savedObjectsClient: SavedObjectsClientContract;
  pkgName: string;
  pkgVersion: string;
  installSource: InstallSource;
  verificationResult?: PackageVerificationResult;
}) {
  const { savedObjectsClient, pkgVersion, pkgName, installSource, verificationResult } = options;

  let savedObjectUpdate: Partial<Installation> = {
    install_version: pkgVersion,
    install_status: 'installing',
    install_started_at: new Date().toISOString(),
    install_source: installSource,
  };

  if (verificationResult) {
    savedObjectUpdate = {
      ...savedObjectUpdate,
      verification_key_id: null, // unset any previous verification key id
      ...formatVerificationResultForSO(verificationResult),
    };
  }

  auditLoggingService.writeCustomSoAuditLog({
    action: 'update',
    id: pkgName,
    savedObjectType: PACKAGES_SAVED_OBJECT_TYPE,
  });

  await savedObjectsClient.update(PACKAGES_SAVED_OBJECT_TYPE, pkgName, savedObjectUpdate);
}

export async function createInstallation(options: {
  savedObjectsClient: SavedObjectsClientContract;
  packageInfo: InstallablePackage;
  installSource: InstallSource;
  spaceId: string;
  verificationResult?: PackageVerificationResult;
}) {
  const { savedObjectsClient, packageInfo, installSource, verificationResult } = options;
  const { name: pkgName, version: pkgVersion } = packageInfo;
  const toSaveESIndexPatterns = generateESIndexPatterns(packageInfo.data_streams);

  // For "stack-aligned" packages, default the `keep_policies_up_to_date` setting to true. For all other
  // packages, default it to undefined. Use undefined rather than false to allow us to differentiate
  // between "unset" and "user explicitly disabled".
  const defaultKeepPoliciesUpToDate = AUTO_UPGRADE_POLICIES_PACKAGES.some(
    ({ name }) => name === packageInfo.name
  )
    ? true
    : undefined;

  let savedObject: Installation = {
    installed_kibana: [],
    installed_kibana_space_id: options.spaceId,
    installed_es: [],
    package_assets: [],
    es_index_patterns: toSaveESIndexPatterns,
    name: pkgName,
    version: pkgVersion,
    install_version: pkgVersion,
    install_status: 'installing',
    install_started_at: new Date().toISOString(),
    install_source: installSource,
    install_format_schema_version: FLEET_INSTALL_FORMAT_VERSION,
    keep_policies_up_to_date: defaultKeepPoliciesUpToDate,
    verification_status: 'unknown',
  };

  if (verificationResult) {
    savedObject = { ...savedObject, ...formatVerificationResultForSO(verificationResult) };
  }

  auditLoggingService.writeCustomSoAuditLog({
    action: 'create',
    id: pkgName,
    savedObjectType: PACKAGES_SAVED_OBJECT_TYPE,
  });

  const created = await savedObjectsClient.create<Installation>(
    PACKAGES_SAVED_OBJECT_TYPE,
    savedObject,
    { id: pkgName, overwrite: true }
  );

  return created;
}

export const saveKibanaAssetsRefs = async (
  savedObjectsClient: SavedObjectsClientContract,
  pkgName: string,
  kibanaAssets: Record<KibanaAssetType, ArchiveAsset[]>
) => {
  auditLoggingService.writeCustomSoAuditLog({
    action: 'update',
    id: pkgName,
    savedObjectType: PACKAGES_SAVED_OBJECT_TYPE,
  });

  const assetRefs = Object.values(kibanaAssets).flat().map(toAssetReference);
  // Because Kibana assets are installed in parallel with ES assets with refresh: false, we almost always run into an
  // issue that causes a conflict error due to this issue: https://github.com/elastic/kibana/issues/126240. This is safe
  // to retry constantly until it succeeds to optimize this critical user journey path as much as possible.
  pRetry(
    () =>
      savedObjectsClient.update(
        PACKAGES_SAVED_OBJECT_TYPE,
        pkgName,
        {
          installed_kibana: assetRefs,
        },
        { refresh: false }
      ),
    { retries: 20 } // Use a number of retries higher than the number of es asset update operations
  );

  return assetRefs;
};

/**
 * Utility function for updating the installed_es field of a package
 */
export const updateEsAssetReferences = async (
  savedObjectsClient: SavedObjectsClientContract,
  pkgName: string,
  currentAssets: EsAssetReference[],
  {
    assetsToAdd = [],
    assetsToRemove = [],
    refresh = false,
  }: {
    assetsToAdd?: EsAssetReference[];
    assetsToRemove?: EsAssetReference[];
    /**
     * Whether or not the update should force a refresh on the SO index.
     * Defaults to `false` for faster updates, should only be `wait_for` if the update needs to be queried back from ES
     * immediately.
     */
    refresh?: 'wait_for' | false;
  }
): Promise<EsAssetReference[]> => {
  const withAssetsRemoved = currentAssets.filter(({ type, id }) => {
    if (
      assetsToRemove.some(
        ({ type: removeType, id: removeId }) => removeType === type && removeId === id
      )
    ) {
      return false;
    }
    return true;
  });

  const deduplicatedAssets = uniqBy(
    [...withAssetsRemoved, ...assetsToAdd],
    ({ type, id }) => `${type}-${id}`
  );

  auditLoggingService.writeCustomSoAuditLog({
    action: 'update',
    id: pkgName,
    savedObjectType: PACKAGES_SAVED_OBJECT_TYPE,
  });

  const {
    attributes: { installed_es: updatedAssets },
  } =
    // Because Kibana assets are installed in parallel with ES assets with refresh: false, we almost always run into an
    // issue that causes a conflict error due to this issue: https://github.com/elastic/kibana/issues/126240. This is safe
    // to retry constantly until it succeeds to optimize this critical user journey path as much as possible.
    await pRetry(
      () =>
        savedObjectsClient.update<Installation>(
          PACKAGES_SAVED_OBJECT_TYPE,
          pkgName,
          {
            installed_es: deduplicatedAssets,
          },
          {
            refresh,
          }
        ),
      // Use a lower number of retries for ES assets since they're installed in serial and can only conflict with
      // the single Kibana update call.
      { retries: 5 }
    );

  return updatedAssets ?? [];
};
/**
 * Utility function for adding assets the installed_es field of a package
 * uses optimistic concurrency control to prevent missed updates
 */
export const optimisticallyAddEsAssetReferences = async (
  savedObjectsClient: SavedObjectsClientContract,
  pkgName: string,
  assetsToAdd: EsAssetReference[]
): Promise<EsAssetReference[]> => {
  const addEsAssets = async () => {
    // TODO: Should this be replaced by a `get()` call from epm/get.ts?
    const so = await savedObjectsClient.get<Installation>(PACKAGES_SAVED_OBJECT_TYPE, pkgName);
    auditLoggingService.writeCustomSoAuditLog({
      action: 'get',
      id: pkgName,
      savedObjectType: PACKAGES_SAVED_OBJECT_TYPE,
    });

    const installedEs = so.attributes.installed_es ?? [];

    const deduplicatedAssets = uniqBy(
      [...installedEs, ...assetsToAdd],
      ({ type, id }) => `${type}-${id}`
    );

    auditLoggingService.writeCustomSoAuditLog({
      action: 'update',
      id: pkgName,
      savedObjectType: PACKAGES_SAVED_OBJECT_TYPE,
    });

    const {
      attributes: { installed_es: updatedAssets },
    } = await savedObjectsClient.update<Installation>(
      PACKAGES_SAVED_OBJECT_TYPE,
      pkgName,
      {
        installed_es: deduplicatedAssets,
      },
      {
        version: so.version,
      }
    );

    return updatedAssets ?? [];
  };

  const onlyRetryConflictErrors = (err: Error) => {
    if (!SavedObjectsErrorHelpers.isConflictError(err)) {
      throw err;
    }
  };

  return pRetry(addEsAssets, { retries: 10, onFailedAttempt: onlyRetryConflictErrors });
};

export async function ensurePackagesCompletedInstall(
  savedObjectsClient: SavedObjectsClientContract,
  esClient: ElasticsearchClient
) {
  const installingPackages = await getPackageSavedObjects(savedObjectsClient, {
    searchFields: ['install_status'],
    search: 'installing',
  });
  const installingPromises = installingPackages.saved_objects.reduce<Array<Promise<InstallResult>>>(
    (acc, pkg) => {
      const startDate = pkg.attributes.install_started_at;
      const nowDate = new Date().toISOString();
      const elapsedTime = Date.parse(nowDate) - Date.parse(startDate);
      const pkgkey = `${pkg.attributes.name}-${pkg.attributes.install_version}`;
      // reinstall package
      if (elapsedTime > MAX_TIME_COMPLETE_INSTALL) {
        acc.push(
          installPackage({
            installSource: 'registry',
            savedObjectsClient,
            pkgkey,
            esClient,
            spaceId: pkg.attributes.installed_kibana_space_id || DEFAULT_SPACE_ID,
          })
        );
      }
      return acc;
    },
    []
  );
  await Promise.all(installingPromises);
  return installingPackages;
}

export async function installIndexTemplatesAndPipelines({
  installedPkg,
  paths,
  packageInfo,
  esReferences,
  savedObjectsClient,
  esClient,
  logger,
  onlyForDataStreams,
}: {
  installedPkg?: Installation;
  paths: string[];
  packageInfo: PackageInfo | InstallablePackage;
  esReferences: EsAssetReference[];
  savedObjectsClient: SavedObjectsClientContract;
  esClient: ElasticsearchClient;
  logger: Logger;
  onlyForDataStreams?: RegistryDataStream[];
}) {
  /**
   * In order to install assets in parallel, we need to split the preparation step from the installation step. This
   * allows us to know which asset references are going to be installed so that we can save them on the packages
   * SO before installation begins. In the case of a failure during installing any individual asset, we'll have the
   * references necessary to remove any assets in that were successfully installed during the rollback phase.
   *
   * This split of prepare/install could be extended to all asset types. Besides performance, it also allows us to
   * more easily write unit tests against the asset generation code without needing to mock ES responses.
   */
  const experimentalDataStreamFeatures = installedPkg?.experimental_data_stream_features ?? [];

  const preparedIngestPipelines = prepareToInstallPipelines(packageInfo, paths, onlyForDataStreams);
  const preparedIndexTemplates = prepareToInstallTemplates(
    packageInfo,
    paths,
    esReferences,
    experimentalDataStreamFeatures,
    onlyForDataStreams
  );

  // Update the references for the templates and ingest pipelines together. Need to be done together to avoid race
  // conditions on updating the installed_es field at the same time
  // These must be saved before we actually attempt to install the templates or pipelines so that we know what to
  // cleanup in the case that a single asset fails to install.
  let newEsReferences: EsAssetReference[] = [];

  if (onlyForDataStreams) {
    // if onlyForDataStreams is present that means we are in create package policy flow
    // not install flow, meaning we do not have a lock on the installation SO
    // so we need to use optimistic concurrency control
    newEsReferences = await optimisticallyAddEsAssetReferences(
      savedObjectsClient,
      packageInfo.name,
      [...preparedIngestPipelines.assetsToAdd, ...preparedIndexTemplates.assetsToAdd]
    );
  } else {
    newEsReferences = await updateEsAssetReferences(
      savedObjectsClient,
      packageInfo.name,
      esReferences,
      {
        assetsToRemove: preparedIndexTemplates.assetsToRemove,
        assetsToAdd: [
          ...preparedIngestPipelines.assetsToAdd,
          ...preparedIndexTemplates.assetsToAdd,
        ],
      }
    );
  }

  // Install index templates and ingest pipelines in parallel since they typically take the longest
  const [installedTemplates] = await Promise.all([
    withPackageSpan('Install index templates', () =>
      preparedIndexTemplates.install(esClient, logger)
    ),
    // installs versionized pipelines without removing currently installed ones
    withPackageSpan('Install ingest pipelines', () =>
      preparedIngestPipelines.install(esClient, logger)
    ),
  ]);

  return {
    esReferences: newEsReferences,
    installedTemplates,
  };
}

export async function installAssetsForInputPackagePolicy(opts: {
  pkgInfo: PackageInfo;
  logger: Logger;
  packagePolicy: NewPackagePolicy;
  esClient: ElasticsearchClient;
  soClient: SavedObjectsClientContract;
  force: boolean;
}) {
  const { pkgInfo, logger, packagePolicy, esClient, soClient, force } = opts;

  if (pkgInfo.type !== 'input') return;

  const paths = await getArchiveFilelist(pkgInfo);
  if (!paths) throw new PackageInvalidArchiveError(`No paths found for ${pkgInfo.name}`);

  const datasetName = packagePolicy.inputs[0].streams[0].vars?.[DATASET_VAR_NAME]?.value;
  const [dataStream] = getNormalizedDataStreams(pkgInfo, datasetName);
  const existingDataStreams = await dataStreamService.getMatchingDataStreams(esClient, {
    type: dataStream.type,
    dataset: datasetName,
  });

  if (existingDataStreams.length) {
    const existingDataStreamsAreFromDifferentPackage = existingDataStreams.some(
      (ds) => ds._meta?.package?.name !== pkgInfo.name
    );
    if (existingDataStreamsAreFromDifferentPackage && !force) {
      // user has opted to send data to an existing data stream which is managed by another
      // package. This means certain custom setting such as elasticsearch settings
      // defined by the package will not have been applied which could lead
      // to unforeseen circumstances, so force flag must be used.
      const streamIndexPattern = dataStreamService.streamPartsToIndexPattern({
        type: dataStream.type,
        dataset: datasetName,
      });

      throw new PackagePolicyValidationError(
        `Datastreams matching "${streamIndexPattern}" already exist and are not managed by this package, force flag is required`
      );
    } else {
      logger.info(
        `Data stream ${dataStream.name} already exists, skipping index template creation for ${packagePolicy.id}`
      );
      return;
    }
  }

  const existingIndexTemplate = await dataStreamService.getMatchingIndexTemplate(esClient, {
    type: dataStream.type,
    dataset: datasetName,
  });

  if (existingIndexTemplate) {
    const indexTemplateOwnnedByDifferentPackage =
      existingIndexTemplate._meta?.package?.name !== pkgInfo.name;
    if (indexTemplateOwnnedByDifferentPackage && !force) {
      // index template already exists but there is no data stream yet
      // we do not want to override the index template

      throw new PackagePolicyValidationError(
        `Index template "${dataStream.type}-${datasetName}" already exist and is not managed by this package, force flag is required`
      );
    } else {
      logger.info(
        `Index template "${dataStream.type}-${datasetName}" already exists, skipping index template creation for ${packagePolicy.id}`
      );
      return;
    }
  }

  const installedPkg = await getInstallation({
    savedObjectsClient: soClient,
    pkgName: pkgInfo.name,
    logger,
  });
  if (!installedPkg)
    throw new PackageNotFoundError(
      `Error while creating index templates: unable to find installed package ${pkgInfo.name}`
    );
  await installIndexTemplatesAndPipelines({
    installedPkg,
    paths,
    packageInfo: pkgInfo,
    esReferences: installedPkg.installed_es || [],
    savedObjectsClient: soClient,
    esClient,
    logger,
    onlyForDataStreams: [dataStream],
  });
}

interface NoPkgArgs {
  pkgVersion: string;
  installedPkg?: undefined;
}

interface HasPkgArgs {
  pkgVersion: string;
  installedPkg: SavedObject<Installation>;
}

type OnlyInstall = Extract<InstallType, 'install'>;
type NotInstall = Exclude<InstallType, 'install'>;

// overloads
export function getInstallType(args: NoPkgArgs): OnlyInstall;
export function getInstallType(args: HasPkgArgs): NotInstall;
export function getInstallType(args: NoPkgArgs | HasPkgArgs): OnlyInstall | NotInstall;

// implementation
export function getInstallType(args: NoPkgArgs | HasPkgArgs): OnlyInstall | NotInstall {
  const { pkgVersion, installedPkg } = args;
  if (!installedPkg) return 'install';

  const currentPkgVersion = installedPkg.attributes.version;
  const lastStartedInstallVersion = installedPkg.attributes.install_version;

  if (pkgVersion === currentPkgVersion && pkgVersion !== lastStartedInstallVersion)
    return 'rollback';
  if (pkgVersion === currentPkgVersion) return 'reinstall';
  if (pkgVersion === lastStartedInstallVersion && pkgVersion !== currentPkgVersion)
    return 'reupdate';
  if (pkgVersion !== lastStartedInstallVersion && pkgVersion !== currentPkgVersion) return 'update';
  throw new FleetError('Unknown install type');
}
