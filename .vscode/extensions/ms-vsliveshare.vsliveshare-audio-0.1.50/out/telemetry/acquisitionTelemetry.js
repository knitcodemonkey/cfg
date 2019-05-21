"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//
//  Copyright (c) Microsoft Corporation. All rights reserved.
//
const telemetryStrings_1 = require("./telemetryStrings");
class AcquisitionTelemetryEventNames {
}
AcquisitionTelemetryEventNames.ACQUIRE_DEPS = 'acquire-deps';
AcquisitionTelemetryEventNames.ACQUIRE_DEPS_FAULT = telemetryStrings_1.TelemetryEventNames.FAULT_PREFIX + 'acquire-deps-fault';
AcquisitionTelemetryEventNames.ACQUIRE_DEPS_PACKAGE = 'acquire-depspackage';
AcquisitionTelemetryEventNames.INSTALL_FAULT = telemetryStrings_1.TelemetryEventNames.FAULT_PREFIX + 'install-fault';
exports.AcquisitionTelemetryEventNames = AcquisitionTelemetryEventNames;
class AcquisitionTelemetryPropertyNames {
}
AcquisitionTelemetryPropertyNames.PROPERTY_PREFIX = telemetryStrings_1.TelemetryPropertyNames.FEATURE_NAME + 'Acquisition.';
/**
 * The stage of installation.
 */
AcquisitionTelemetryPropertyNames.INSTALLATION_STAGE = AcquisitionTelemetryPropertyNames.PROPERTY_PREFIX + 'InstallationStage';
/**
 * If acquisition failed, the url of package for which it failed.
 */
AcquisitionTelemetryPropertyNames.PACKAGE_URL = AcquisitionTelemetryPropertyNames.PROPERTY_PREFIX + 'PackageUrl';
/**
 * If acquisition failed, the url of package for which it failed.
 */
AcquisitionTelemetryPropertyNames.PACKAGE_CODE = AcquisitionTelemetryPropertyNames.PROPERTY_PREFIX + 'PackageCode';
/**
 * The platform of the client.
 */
AcquisitionTelemetryPropertyNames.INSTALLATION_PLATFORM = AcquisitionTelemetryPropertyNames.PROPERTY_PREFIX + 'InstallationPlatform';
/**
 * The architecture of the client.
 */
AcquisitionTelemetryPropertyNames.INSTALLATION_ARCH = AcquisitionTelemetryPropertyNames.PROPERTY_PREFIX + 'InstallationArch';
/**
 * Did it end up downloading
 */
AcquisitionTelemetryPropertyNames.DID_DOWNLOAD = AcquisitionTelemetryPropertyNames.PROPERTY_PREFIX + 'DidDownload';
/**
 * Whether the checksum passef
 */
AcquisitionTelemetryPropertyNames.CHECKSUM_PASS = AcquisitionTelemetryPropertyNames.PROPERTY_PREFIX + 'ChecksumPass';
/**
 * Total number of files in the base folder pre unpack
 */
AcquisitionTelemetryPropertyNames.TOTAL_BASE_FILES_PRE_UNPACK = AcquisitionTelemetryPropertyNames.PROPERTY_PREFIX + 'TotalBaseFilesPreUnpack';
/**
 * Total number of files in the base folder post unpack
 */
AcquisitionTelemetryPropertyNames.TOTAL_BASE_FILES_POST_UNPACK = AcquisitionTelemetryPropertyNames.PROPERTY_PREFIX + 'TotalBaseFilesPostUnpack';
/**
 * Total number of files in the base folder pre move
 */
AcquisitionTelemetryPropertyNames.TOTAL_BASE_FILES_PRE_MOVE = AcquisitionTelemetryPropertyNames.PROPERTY_PREFIX + 'TotalBaseFilesPreMove';
/**
 * Total number of files in the base folder post move
 */
AcquisitionTelemetryPropertyNames.TOTAL_BASE_FILES_POST_MOVE = AcquisitionTelemetryPropertyNames.PROPERTY_PREFIX + 'TotalBaseFilesPostMove';
/**
 * Total number of files extracted
 */
AcquisitionTelemetryPropertyNames.TOTAL_FILES_EXTRACTED = AcquisitionTelemetryPropertyNames.PROPERTY_PREFIX + 'TotalFilesExtracted';
/**
 * Difference in the total number of files moved
 */
AcquisitionTelemetryPropertyNames.TOTAL_FILES_MOVED_OFFSET = AcquisitionTelemetryPropertyNames.PROPERTY_PREFIX + 'TotalFileMovedOffset';
exports.AcquisitionTelemetryPropertyNames = AcquisitionTelemetryPropertyNames;
//# sourceMappingURL=acquisitionTelemetry.js.map