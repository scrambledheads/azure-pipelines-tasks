import tl = require('vsts-task-lib/task');
import * as ParameterParser from './ParameterParserUtility';

var jsonSubstitutionUtility = require('webdeployment-common/jsonvariablesubstitutionutility.js');
var xmlSubstitutionUtility = require('webdeployment-common/xmlvariablesubstitutionutility.js');
var xdtTransformationUtility = require('webdeployment-common/xdttransformationutility.js');

export function fileTransformations(isFolderBasedDeployment: boolean, JSONFiles: any, xmlTransformation: boolean, xmlVariableSubstitution: boolean, folderPath: string, isMSBuildPackage: boolean) {

    if(xmlTransformation) {
        if(isMSBuildPackage) {
            var debugMode = tl.getVariable('system.debug');
            if(debugMode && debugMode.toLowerCase() == 'true') {
                tl.warning(tl.loc('AutoParameterizationMessage'));
            }
            else {
                console.log(tl.loc('AutoParameterizationMessage'));
            }
        }
        var environmentName = tl.getVariable('Release.EnvironmentName');
        if(tl.osType().match(/^Win/)) {
            var transformConfigs = ["Release.config"];
            if(environmentName && environmentName.toLowerCase() != 'release') {
                transformConfigs.push(environmentName + ".config");
            }
            var isTransformationApplied: boolean = xdtTransformationUtility.basicXdtTransformation(folderPath, transformConfigs);
            
            if(isTransformationApplied)
            {
                console.log(tl.loc("XDTTransformationsappliedsuccessfully"));
            }
            
        }
        else {
            throw new Error(tl.loc("CannotPerformXdtTransformationOnNonWindowsPlatform"));
        }
    }

    if(xmlVariableSubstitution) {
        xmlSubstitutionUtility.substituteAppSettingsVariables(folderPath, isFolderBasedDeployment);
        console.log(tl.loc('XMLvariablesubstitutionappliedsuccessfully'));
    }

    if(JSONFiles.length != 0) {
        jsonSubstitutionUtility.jsonVariableSubstitution(folderPath, JSONFiles);
        console.log(tl.loc('JSONvariablesubstitutionappliedsuccessfully'));
    }
}

export function advancedFileTransformations(isFolderBasedDeployment: boolean, targetFiles: any, xmlTransformation: boolean, variableSubstitutionFileFormat: string, folderPath: string, transformationRules: any) {

    if(xmlTransformation) {
        var environmentName = tl.getVariable('Release.EnvironmentName');
        if(tl.osType().match(/^Win/)) {
            if(transformationRules.length > 0){
                var isTransformationApplied: boolean = true;
                transformationRules.forEach(function(rule) {
                    var args = ParameterParser.parse(rule);
                    if(Object.keys(args).length < 2 || !args["transform"] || !args["xml"]) {
                       tl.error(tl.loc("MissingArgumentsforXMLTransformation"));
                    }
                    else if(Object.keys(args).length > 2) {
                        isTransformationApplied = isTransformationApplied && xdtTransformationUtility.specialXdtTransformation(folderPath, args["transform"].value, args["xml"].value, args["result"].value);
                    }
                    else {
                        isTransformationApplied = isTransformationApplied && xdtTransformationUtility.specialXdtTransformation(folderPath, args["transform"].value, args["xml"].value);
                    }
                });
            }
            else{                
                let transformConfigs = ["Release.config"];
                if(environmentName && environmentName.toLowerCase() != 'release') {
                    transformConfigs.push(environmentName + ".config");
                }
                var isTransformationApplied: boolean = xdtTransformationUtility.basicXdtTransformation(folderPath, transformConfigs);
            }
            
            if(isTransformationApplied)
            {
                console.log(tl.loc("XDTTransformationsappliedsuccessfully"));
            }
            
        }
        else {
           tl.error(tl.loc("CannotPerformXdtTransformationOnNonWindowsPlatform"));
        }
    }

    if(variableSubstitutionFileFormat === "xml") {
        if(targetFiles.length == 0) { 
            xmlSubstitutionUtility.substituteAppSettingsVariables(folderPath, isFolderBasedDeployment);
        }
        else {            
            targetFiles.forEach(function(fileName) { 
                xmlSubstitutionUtility.substituteAppSettingsVariables(folderPath, isFolderBasedDeployment, fileName);
            });
        }
        console.log(tl.loc('XMLvariablesubstitutionappliedsuccessfully'));
    }

    if(variableSubstitutionFileFormat === "json") {
        // For Json variable substitution if no target files are specified file files matching **\*.json
        if(!targetFiles || targetFiles.length == 0){
            targetFiles = ["**\\*.json"];
        }
        jsonSubstitutionUtility.jsonVariableSubstitution(folderPath, targetFiles);
        console.log(tl.loc('JSONvariablesubstitutionappliedsuccessfully'));
    }
}