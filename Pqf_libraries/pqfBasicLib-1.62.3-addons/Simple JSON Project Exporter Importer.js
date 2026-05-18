"use strict";
// Requires pqfBasicLib 1.53.0+

const DEBUG = true;

const IMPORT_FILENAME = "ProjectImport.json";
const OMIT_ATTS_PER_OBJ_TYPE = {
    "project": [],
    "subObjects": [],
    "scenario": [],
    "workItems": ["owner", "requiredSkill"],
    "constraints": []
};

pqfLib.setDebuggingMode(DEBUG);

let projectId = null;
let portfolioId = null;
let jsdata = null;
if (typeof reference !== 'undefined') {
    switch (reference.type) {

        case "Project":
            projectId = reference.id;
            jsdata = [pqfLib.projects.exportProjectData(projectId, OMIT_ATTS_PER_OBJ_TYPE)];
            break;

        case "ProjectPortfolio":
            portfolioId = reference.id;

            // Check if there is a document with a given name
            let docLinks = Pqf.pf.getDocumentLinks("ProjectPortfolio", portfolioId, null, true);
            let importDoc = docLinks.find(x => x.name === IMPORT_FILENAME);
            if(importDoc) {
                // Document with given name exists
                console.log("Importing...");
                let projects = pqfLib.docLink.getDocument(importDoc, "json");
                let portfolio = Pqf.pm.getProjectPortfolio(portfolioId);
                let results = [];
                projects.forEach(function(projectData) {
                    let result = pqfLib.projects.importProjectData(projectData, portfolioId);
                    results.push(result);
                });
                jsdata = results;
            } else {
                console.log("Exporting...");
                jsdata = pqfLib.portfolios.exportPortfolioData(portfolioId, OMIT_ATTS_PER_OBJ_TYPE);
            }
            break;
        default:
    }
}
jsdata;