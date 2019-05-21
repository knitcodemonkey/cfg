"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-plus");
const path = require("path");
const constants_1 = require("../constants");
const Component_1 = require("./Interfaces/Component");
var DependencyType;
(function (DependencyType) {
    DependencyType[DependencyType["Other"] = 0] = "Other";
    DependencyType[DependencyType["Input"] = 1] = "Input";
    DependencyType[DependencyType["Output"] = 2] = "Output";
})(DependencyType = exports.DependencyType || (exports.DependencyType = {}));
class AzureConfigFileHandler {
    constructor(projectRoot) {
        this.projectRootPath = projectRoot;
        this.configFilePath = path.join(this.projectRootPath, constants_1.AzureComponentsStorage.folderName, constants_1.AzureComponentsStorage.fileName);
    }
    createIfNotExists() {
        const azureConfigs = { componentConfigs: [] };
        const azureConfigFolderPath = path.join(this.projectRootPath, constants_1.AzureComponentsStorage.folderName);
        if (!fs.existsSync(azureConfigFolderPath)) {
            fs.mkdirSync(azureConfigFolderPath);
        }
        const azureConfigFilePath = path.join(azureConfigFolderPath, constants_1.AzureComponentsStorage.fileName);
        if (!fs.existsSync(azureConfigFilePath)) {
            fs.writeFileSync(azureConfigFilePath, JSON.stringify(azureConfigs, null, 4));
        }
    }
    getSortedComponents() {
        try {
            const azureConfigs = JSON.parse(fs.readFileSync(this.configFilePath, 'utf8'));
            const components = [];
            const componentConfigs = azureConfigs.componentConfigs;
            const sortedComponentIds = [];
            let lastSortedCount = 0;
            do {
                lastSortedCount = components.length;
                for (const componentConfig of componentConfigs) {
                    if (sortedComponentIds.indexOf(componentConfig.id) > -1) {
                        continue;
                    }
                    let hold = false;
                    for (const dependency of componentConfig.dependencies) {
                        if (sortedComponentIds.indexOf(dependency.id) === -1) {
                            hold = true;
                            break;
                        }
                    }
                    if (hold) {
                        continue;
                    }
                    sortedComponentIds.push(componentConfig.id);
                    components.push(componentConfig);
                }
            } while (lastSortedCount < componentConfigs.length &&
                lastSortedCount < components.length);
            return components;
        }
        catch (error) {
            throw new Error('Invalid azure components config file.');
        }
    }
    getComponentIndexById(id) {
        try {
            const azureConfigs = JSON.parse(fs.readFileSync(this.configFilePath, 'utf8'));
            const componentIndex = azureConfigs.componentConfigs.findIndex(config => config.id === (id));
            return componentIndex;
        }
        catch (error) {
            throw new Error('Invalid azure components config file.');
        }
    }
    getComponentById(id) {
        try {
            const azureConfigs = JSON.parse(fs.readFileSync(this.configFilePath, 'utf8'));
            const componentConfig = azureConfigs.componentConfigs.find(config => config.id === (id));
            return componentConfig;
        }
        catch (error) {
            throw new Error('Invalid azure components config file.');
        }
    }
    getComponentByType(type) {
        try {
            const azureConfigs = JSON.parse(fs.readFileSync(this.configFilePath, 'utf8'));
            const componentConfig = azureConfigs.componentConfigs.find(config => config.type ===
                (typeof type === 'string' ? type : Component_1.ComponentType[type]));
            return componentConfig;
        }
        catch (error) {
            throw new Error('Invalid azure components config file.');
        }
    }
    getComponentsByType(type) {
        try {
            const azureConfigs = JSON.parse(fs.readFileSync(this.configFilePath, 'utf8'));
            const componentConfig = azureConfigs.componentConfigs.filter(config => config.type ===
                (typeof type === 'string' ? type : Component_1.ComponentType[type]));
            return componentConfig;
        }
        catch (error) {
            throw new Error('Invalid azure components config file.');
        }
    }
    appendComponent(component) {
        try {
            const azureConfigs = JSON.parse(fs.readFileSync(this.configFilePath, 'utf8'));
            azureConfigs.componentConfigs.push(component);
            fs.writeFileSync(this.configFilePath, JSON.stringify(azureConfigs, null, 4));
            return azureConfigs;
        }
        catch (error) {
            throw new Error('Invalid azure components config file.');
        }
    }
    updateComponent(index, componentInfo) {
        try {
            const azureConfigs = JSON.parse(fs.readFileSync(this.configFilePath, 'utf8'));
            const component = azureConfigs.componentConfigs[index];
            if (!component) {
                throw new Error('Invalid index of componet list.');
            }
            component.componentInfo = componentInfo;
            fs.writeFileSync(this.configFilePath, JSON.stringify(azureConfigs, null, 4));
            return azureConfigs;
        }
        catch (error) {
            throw new Error('Invalid azure components config file.');
        }
    }
}
exports.AzureConfigFileHandler = AzureConfigFileHandler;
//# sourceMappingURL=AzureComponentConfig.js.map