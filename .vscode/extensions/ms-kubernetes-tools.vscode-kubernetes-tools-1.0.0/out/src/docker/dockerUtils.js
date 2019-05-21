"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
const url = require("url");
const kubeChannel_1 = require("../kubeChannel");
const kubectlUtils_1 = require("../kubectlUtils");
const shell_1 = require("../shell");
const dictionary_1 = require("../utils/dictionary");
var DockerClient;
(function (DockerClient) {
    DockerClient["docker"] = "docker";
    DockerClient["dockerCompose"] = "docker-compose";
})(DockerClient = exports.DockerClient || (exports.DockerClient = {}));
/**
 * Build the docker image first. If imagePrefix is not empty, push the image to remote docker hub, too.
 *
 * @param dockerClient the possible dockerClient： docker or docker-compose.
 * @param shellOpts any option available to Node.js's child_process.exec().
 * @param imagePrefix the image prefix for docker images (e.g. 'docker.io/brendanburns').
 * @return the image name.
 */
function buildAndPushDockerImage(dockerClient, shellOpts, imagePrefix) {
    return __awaiter(this, void 0, void 0, function* () {
        const cwd = shellOpts.cwd || vscode.workspace.rootPath;
        const image = yield getDefaultImageName(cwd, imagePrefix);
        yield buildDockerImage(dockerClient, image, shellOpts);
        if (imagePrefix) {
            yield pushDockerImage(dockerClient, image, shellOpts);
        }
        return image;
    });
}
exports.buildAndPushDockerImage = buildAndPushDockerImage;
function sanitiseTag(name) {
    // Name components may contain lowercase letters, digits and separators.
    // A separator is defined as a period, one or two underscores, or one or
    // more dashes. A name component may not start or end with a separator.
    // https://docs.docker.com/engine/reference/commandline/tag/#extended-description
    return name.toLowerCase().replace(/[^a-z0-9._-]/g, '-');
}
function getDefaultImageName(cwd, imagePrefix) {
    return __awaiter(this, void 0, void 0, function* () {
        const name = sanitiseTag(path.basename(cwd));
        const version = yield findVersion(cwd);
        let image = `${name}:${version}`;
        if (imagePrefix) {
            image = `${imagePrefix}/${image}`;
        }
        return image;
    });
}
function findVersion(cwd) {
    return __awaiter(this, void 0, void 0, function* () {
        const shellOpts = Object.assign({}, shell_1.shell.execOpts(), { cwd });
        const shellResult = yield shell_1.shell.execCore('git describe --always --dirty', shellOpts);
        return shellResult.code === 0 ? shellResult.stdout.trim() : "latest";
    });
}
function buildDockerImage(dockerClient, image, shellOpts) {
    return __awaiter(this, void 0, void 0, function* () {
        // Build docker image.
        const buildResult = yield shell_1.shell.execCore(`${dockerClient} build -t ${image} .`, shellOpts);
        if (buildResult.code !== 0) {
            throw new Error(`Image build failed: ${buildResult.stderr}`);
        }
        kubeChannel_1.kubeChannel.showOutput(image + ' built.');
    });
}
function pushDockerImage(dockerClient, image, shellOpts) {
    return __awaiter(this, void 0, void 0, function* () {
        // Push docker image.
        const pushResult = yield shell_1.shell.execCore(`${dockerClient} push ${image}`, shellOpts);
        if (pushResult.code !== 0) {
            throw new Error(`Image push failed: ${pushResult.stderr}`);
        }
        kubeChannel_1.kubeChannel.showOutput(image + ' pushed.');
    });
}
/**
 * When using the command "minikube docker-env" to get the local kubernetes docker env, it needs run with the admin privilege.
 * To workaround this, this function will try to resolve the equivalent docker env from kubeconfig instead.
 */
function resolveKubernetesDockerEnv(kubectl) {
    return __awaiter(this, void 0, void 0, function* () {
        const dockerEnv = dictionary_1.Dictionary.of();
        dockerEnv["DOCKER_API_VERSION"] = yield dockerApiVersion();
        const currentCluster = yield kubectlUtils_1.getCurrentClusterConfig(kubectl);
        if (!currentCluster || !currentCluster.server || !currentCluster.certificateAuthority) {
            return {};
        }
        if (/^https/.test(currentCluster.server)) {
            dockerEnv["DOCKER_TLS_VERIFY"] = 1;
        }
        const serverUrl = url.parse(currentCluster.server);
        dockerEnv["DOCKER_HOST"] = `tcp://${serverUrl.hostname}:2376`;
        const certDir = path.dirname(currentCluster.certificateAuthority);
        if (fs.existsSync(path.join(certDir, "certs"))) {
            dockerEnv["DOCKER_CERT_PATH"] = path.join(certDir, "certs");
        }
        else {
            dockerEnv["DOCKER_CERT_PATH"] = certDir;
        }
        return dockerEnv;
    });
}
exports.resolveKubernetesDockerEnv = resolveKubernetesDockerEnv;
function dockerApiVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        const defaultDockerVersion = "1.23";
        const versionResult = yield shell_1.shell.exec(`docker version --format "{{.Client.APIVersion}}"`);
        if (versionResult && versionResult.code === 0) {
            return versionResult.stdout.trim();
        }
        return defaultDockerVersion;
    });
}
//# sourceMappingURL=dockerUtils.js.map