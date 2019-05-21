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
const _ = require("lodash");
const semver = require("semver");
const vscode_uri_1 = require("vscode-uri");
const vscode = require("vscode");
const yaml_locator_1 = require("./yaml-locator");
const yaml_constant_1 = require("./yaml-constant");
const util = require("./yaml-util");
const schema_formatting_1 = require("../schema-formatting");
class KubernetesSchemaHolder {
    constructor() {
        // the schema for kubernetes
        this.definitions = {};
    }
    // load the kubernetes schema and make some modifications to $ref node
    loadSchema(schemaFile, schemaEnumFile) {
        const schemaRaw = util.loadJson(schemaFile);
        this.schemaEnums = schemaEnumFile ? util.loadJson(schemaEnumFile) : {};
        const definitions = schemaRaw.definitions;
        for (const name of Object.keys(definitions)) {
            this.saveSchemaWithManifestStyleKeys(name, definitions[name]);
        }
        for (const schema of _.values(this.definitions)) {
            if (schema.properties) {
                // the swagger schema has very short description on properties, we need to get the actual type of
                // the property and provide more description/properties details, just like `kubernetes explain` do.
                _.each(schema.properties, (propVal, propKey) => {
                    if (schema.kind && propKey === 'kind') {
                        propVal.markdownDescription = this.getMarkdownDescription(schema.kind, undefined, schema, true);
                        return;
                    }
                    const currentPropertyTypeRef = propVal.$ref || (propVal.items ? propVal.items.$ref : undefined);
                    if (_.isString(currentPropertyTypeRef)) {
                        const id = getNameInDefinitions(currentPropertyTypeRef);
                        const propSchema = this.lookup(id);
                        if (propSchema) {
                            propVal.markdownDescription = this.getMarkdownDescription(propKey, propVal, propSchema);
                        }
                    }
                    else {
                        propVal.markdownDescription = this.getMarkdownDescription(propKey, propVal, undefined);
                    }
                });
                // fix on each node in properties for $ref since it will directly reference '#/definitions/...'
                // we need to convert it into schema like 'kubernetes://schema/...'
                // we need also an array to collect them since we need to get schema from _definitions, at this point, we have
                // not finished the process of add schemas to _definitions, call patchOnRef will fail for some cases.
                this.replaceDefinitionRefsWithYamlSchemaUris(schema.properties);
                this.loadEnumsForKubernetesSchema(schema);
            }
        }
    }
    // get kubernetes schema by the key
    lookup(key) {
        return key ? this.definitions[key.toLowerCase()] : undefined;
    }
    /**
     * Save the schema object in swagger json to schema map.
     *
     * @param {string} name the property name in definition node of swagger json
     * @param originalSchema the origin schema object in swagger json
     */
    saveSchemaWithManifestStyleKeys(name, originalSchema) {
        if (isGroupVersionKindStyle(originalSchema)) {
            // if the schema contains 'x-kubernetes-group-version-kind'. then it is a direct kubernetes manifest,
            getManifestStyleSchemas(originalSchema).forEach((schema) => {
                this.saveSchema(Object.assign({ name }, schema));
            });
        }
        else {
            // if x-kubernetes-group-version-kind cannot be found, then it is an in-direct schema refereed by
            // direct kubernetes manifest, eg: io.k8s.kubernetes.pkg.api.v1.PodSpec
            this.saveSchema(Object.assign({ name }, originalSchema));
        }
    }
    // replace schema $ref with values like 'kubernetes://schema/...'
    replaceDefinitionRefsWithYamlSchemaUris(node) {
        if (!node) {
            return;
        }
        if (_.isArray(node)) {
            for (const subItem of node) {
                this.replaceDefinitionRefsWithYamlSchemaUris(subItem);
            }
        }
        if (!_.isObject(node)) {
            return;
        }
        for (const key of Object.keys(node)) {
            this.replaceDefinitionRefsWithYamlSchemaUris(node[key]);
        }
        if (_.isString(node.$ref)) {
            const name = getNameInDefinitions(node.$ref);
            const schema = this.lookup(name);
            if (schema) {
                // replacing $ref
                node.$ref = util.makeKubernetesUri(schema.name);
            }
        }
    }
    // add enum field for pre-defined enums in schema-enums json file
    loadEnumsForKubernetesSchema(node) {
        if (node.properties && this.schemaEnums[node.name]) {
            _.each(node.properties, (propSchema, propKey) => {
                if (this.schemaEnums[node.name][propKey]) {
                    propSchema.enum = this.schemaEnums[node.name][propKey];
                }
            });
        }
    }
    // save the schema to the _definitions
    saveSchema(schema) {
        if (schema.name) {
            this.definitions[schema.name.toLowerCase()] = schema;
        }
        if (schema.id) {
            this.definitions[schema.id.toLowerCase()] = schema;
        }
    }
    // get the markdown format of document for the current property and the type of current property
    getMarkdownDescription(currentPropertyName, currentProperty, targetSchema, isKind = false) {
        if (isKind) {
            return schema_formatting_1.formatComplex(currentPropertyName, targetSchema.description, undefined, targetSchema.properties);
        }
        if (!targetSchema) {
            return schema_formatting_1.formatOne(currentPropertyName, schema_formatting_1.formatType(currentProperty), currentProperty.description);
        }
        const properties = targetSchema.properties;
        if (properties) {
            return schema_formatting_1.formatComplex(currentPropertyName, currentProperty ? currentProperty.description : "", targetSchema.description, properties);
        }
        return currentProperty ? currentProperty.description : (targetSchema ? targetSchema.description : "");
    }
}
const kubeSchema = new KubernetesSchemaHolder();
function registerYamlSchemaSupport() {
    return __awaiter(this, void 0, void 0, function* () {
        kubeSchema.loadSchema(yaml_constant_1.KUBERNETES_SCHEMA_FILE, yaml_constant_1.KUBERNETES_SCHEMA_ENUM_FILE);
        const yamlPlugin = yield activateYamlExtension();
        if (!yamlPlugin || !yamlPlugin.registerContributor) {
            // activateYamlExtension has already alerted to users for errors.
            return;
        }
        // register for kubernetes schema provider
        yamlPlugin.registerContributor(yaml_constant_1.KUBERNETES_SCHEMA, requestYamlSchemaUriCallback, requestYamlSchemaContentCallback);
    });
}
exports.registerYamlSchemaSupport = registerYamlSchemaSupport;
// see docs from YamlSchemaContributor
function requestYamlSchemaUriCallback(resource) {
    const textEditor = vscode.window.visibleTextEditors.find((editor) => editor.document.uri.toString() === resource);
    if (textEditor) {
        const yamlDocs = yaml_locator_1.yamlLocator.getYamlDocuments(textEditor.document);
        const choices = [];
        yamlDocs.forEach((doc) => {
            // if the yaml document contains apiVersion and kind node, it will report it is a kubernetes yaml
            // file
            const topLevelMapping = doc.nodes.find((node) => node.kind === 'MAPPING');
            if (topLevelMapping) {
                // if the overall yaml is an map, find the apiVersion and kind properties in yaml
                const apiVersion = util.getYamlMappingValue(topLevelMapping, 'apiVersion');
                const kind = util.getYamlMappingValue(topLevelMapping, 'kind');
                if (apiVersion && kind) {
                    choices.push(apiVersion + yaml_constant_1.GROUP_VERSION_KIND_SEPARATOR + kind);
                }
            }
        });
        return util.makeKubernetesUri(choices);
    }
    return undefined;
}
// see docs from YamlSchemaContributor
function requestYamlSchemaContentCallback(uri) {
    const parsedUri = vscode_uri_1.default.parse(uri);
    if (parsedUri.scheme !== yaml_constant_1.KUBERNETES_SCHEMA) {
        return undefined;
    }
    if (!parsedUri.path || !parsedUri.path.startsWith('/')) {
        return undefined;
    }
    // slice(1) to remove the first '/' in schema
    // eg: kubernetes://schema/io.k8s.kubernetes.pkg.apis.extensions.v1beta1.httpingresspath will have
    // path '/io.k8s.kubernetes.pkg.apis.extensions.v1beta1.httpingresspath'
    const manifestType = parsedUri.path.slice(1);
    // if it is a multiple choice, make an 'oneof' schema.
    if (manifestType.includes('+')) {
        const manifestRefList = manifestType.split('+').choose(util.makeRefOnKubernetes);
        // yaml language server supports schemaSequence at
        // https://github.com/redhat-developer/yaml-language-server/pull/81
        return JSON.stringify({ schemaSequence: manifestRefList });
    }
    const schema = kubeSchema.lookup(manifestType);
    // convert it to string since vscode-yaml need the string format
    if (schema) {
        return JSON.stringify(schema);
    }
    return undefined;
}
/**
 * Tell whether or not the swagger schema is a kubernetes manifest schema, a kubernetes manifest schema like Service
 * should have `x-kubernetes-group-version-kind` node.
 *
 * @param originalSchema the origin schema object in swagger json
 * @return whether or not the swagger schema is
 */
function isGroupVersionKindStyle(originalSchema) {
    return originalSchema[yaml_constant_1.KUBERNETES_GROUP_VERSION_KIND] && originalSchema[yaml_constant_1.KUBERNETES_GROUP_VERSION_KIND].length;
}
/**
 * Process on kubernetes manifest schemas, for each selector in x-kubernetes-group-version-kind,
 * extract apiVersion and kind and make a id composed by apiVersion and kind.
 *
 * @param originalSchema the origin schema object in swagger json
 * @returns {KubernetesSchema[]} an array of schemas for the same manifest differentiated by id/apiVersion/kind;
 */
function getManifestStyleSchemas(originalSchema) {
    const schemas = Array.of();
    // eg: service, pod, deployment
    const groupKindNode = originalSchema[yaml_constant_1.KUBERNETES_GROUP_VERSION_KIND];
    // delete 'x-kubernetes-group-version-kind' since it is not a schema standard, it is only a selector
    delete originalSchema[yaml_constant_1.KUBERNETES_GROUP_VERSION_KIND];
    groupKindNode.forEach((groupKindNode) => {
        const gvk = util.parseKubernetesGroupVersionKind(groupKindNode);
        if (!gvk) {
            return;
        }
        const { id, apiVersion, kind } = gvk;
        // a direct kubernetes manifest has two reference keys: id && name
        // id: apiVersion + kind
        // name: the name in 'definitions' of schema
        schemas.push(Object.assign({ id,
            apiVersion,
            kind }, originalSchema));
    });
    return schemas;
}
// convert '#/definitions/com.github.openshift.origin.pkg.build.apis.build.v1.ImageLabel' to
// 'com.github.openshift.origin.pkg.build.apis.build.v1.ImageLabel'
function getNameInDefinitions($ref) {
    const prefix = '#/definitions/';
    if ($ref.startsWith(prefix)) {
        return $ref.slice(prefix.length);
    }
    else {
        return prefix;
    }
}
// find redhat.vscode-yaml extension and try to activate it to get the yaml contributor
function activateYamlExtension() {
    return __awaiter(this, void 0, void 0, function* () {
        const ext = vscode.extensions.getExtension(yaml_constant_1.VSCODE_YAML_EXTENSION_ID);
        if (!ext) {
            vscode.window.showWarningMessage('Please install \'YAML Support by Red Hat\' via the Extensions pane.');
            return undefined;
        }
        const yamlPlugin = yield ext.activate();
        if (!yamlPlugin || !yamlPlugin.registerContributor) {
            vscode.window.showWarningMessage('The installed Red Hat YAML extension doesn\'t support Kubernetes Intellisense. Please upgrade \'YAML Support by Red Hat\' via the Extensions pane.');
            return undefined;
        }
        if (ext.packageJSON.version && !semver.gte(ext.packageJSON.version, '0.0.15')) {
            vscode.window.showWarningMessage('The installed Red Hat YAML extension doesn\'t support multiple schemas. Please upgrade \'YAML Support by Red Hat\' via the Extensions pane.');
        }
        return yamlPlugin;
    });
}
//# sourceMappingURL=yaml-schema.js.map