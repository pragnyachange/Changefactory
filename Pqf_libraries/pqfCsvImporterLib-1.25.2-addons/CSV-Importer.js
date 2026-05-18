"use strict";
//
// NOTE: *** This automation works with CREATED and UPDATED triggers on object type LibraryModule/DocumentLink ***
//
// Array of usage rules
// -------------------------------
// Each rule defines a set of users (array of usernames, optional) and a set of roles (array of role IDs, optional),
// as well as an import realm (optional) consisting of an object type (enum value, mandatory) and a set of import containers (array of object IDs, optional).
//
// Each rule is considered separately, i.e., if any one of all the rules applies, the import can be carried out.
// If ALL conditions in a rule are met (i.e., user is in the username set AND has one of the roles in the role set),
// then the import for the import object type can be executed, if the objects will be created in the given containers.
// If a set is null, it means that any value is allowed (e.g., users = null means that ANY user is allowed, and roles = null means that ANY role is allowed).
//
// NOTE that the user also needs to have ***update permission in the import folder***. Otherwise no CSV import files can be uploaded.

const SYSTEM_ADMINISTRATOR_ROLE_ID = "B3A4FCE6492348BD8A4470A45FB31E5D";
const LOGIN_ROLE_ID = "0003831E2B484EDEB2B32D3297DF4A62";

const RESTRICTED_USAGE_RULES = [
	{ // SysAdmins can do anything.
		"roles": [SYSTEM_ADMINISTRATOR_ROLE_ID]
	},
	{ // The test user with the login role can only import efforts to projects in a specific portfolio.
		"users": ["test"], //optional
		"roles": [LOGIN_ROLE_ID], // optional
		"importRealm": { // optional
			"objectType": "IMPORT-OBJECT-TYPE-PRJ-EFF-ACT", // mandatory
			"containers": { // optional
				"portfolios": ["A79447A2047949D4B863818EB80E74A9"], // optional
				"orgUnits": [""] // optional
			}
		}
	}
];

const IMPORT_FOLDER_ID = "806390A14AC9404CA081F380FDB0C2B0";

if(typeof trigger === "undefined") { // script was manually triggered
	console.log("Script manually executed. Not doing anything 😊");
} else if(trigger.action == "CREATED") {
	// No need to check rules. If a user can create a document in this folder, then they are also allowed to mark the document as importable.
	let ref = Pqf.pf.getDocumentLinkParent(trigger.objectId);
	let doc = Pqf.pf.getDocumentLink(ref.type, ref.id, trigger.objectId);
	pqfCsvImportLib.import.markLibraryDocAsImportable(doc, IMPORT_FOLDER_ID);
} else if(trigger.action === "UPDATED") {
	let ref = Pqf.pf.getDocumentLinkParent(trigger.objectId);
    let doc = Pqf.pf.getDocumentLink(ref.type, ref.id, trigger.objectId);
	pqfCsvImportLib.import.setMaxNumRecordsPerRun(100);
    pqfCsvImportLib.import.processCsvDocument(doc, RESTRICTED_USAGE_RULES);
}