## This file includes all the steps to recreate the example shown in the JTF forum post

You create a widget in the Cockpit view that can be called on an OU (organizational unit) and displays a table of resources there, for example:

- Name
- E-Mail


For this to work, you need two things:

A JS Sandbox
    it collects the data
    it builds a JTF object from the data
    it returns this object
A CockpitWidget Definition
    it tells PQFORCE that this widget exists
    it determines on which object type the widget is visible
    it references the sandbox via the sandboxId
    it contains the widget configuration (definition)

The order is important:

First create the sandbox, then create the widget definition.

Step 1: Define goal and scope:
    For this example, that means:

        Widget type: JTF
        Target object: OU
        Use case: Table of all resources of an OU
        Displayed columns:
        Name
        E-Mail
        Optional setting:
        Include Sub-OUs
        Display: Table
        Timeline: hidden

    Because from this you can derive:

        objectType of the widget definition
        the properties in definition
        what data the sandbox must load
        how meta.columns and data must be structured



Okay so we have three files: 
    - resList.js (which is the javascript file) -> u can use for the sandbox
    - widget_obj.json (the json file) -> u use for the API call in Bruno
        - defines name of widget and where to find it 

1. create a JS Sandbox 
        - name: JTF Widget Example recreated 
        - in the libraries u need to select the ones u are using ( no need for import but need to click to activate)

2. Go to bruno (api call " Recreate JTF Widget From Forum")
        - create new PUT request: PUT https://demo.pqforce.com/API/V2/CLF/CockpitWidget/C501F4C74A044D329AF81C0DD9A4F736/WithTranslations //same its just basically saying hey pqforce we are defining a widget here 

        - C501F4C74A044D329AF81C0DD9A4F736 is a randomly generated uuid which u get with: 
        https://demo.pqforce.com/API/V2/CLF/Uuid/New/1 body= no body
        - in body copy widget_obj.json & REPLACE :
            - L.51 "sandboxId": "4D8288BA0DE04228887A613E6D89F167" with the sandbox ID of the previous created sandbox

            - L.34 "objectType": "HRM-RES-TYP-OU" with where u want the widget to appear (so on the interface u would here need to go HRM- RES-Organigramm- Organizational unit ) then u would go to the cockpit , "Add Widget" and add the widget 

                - so how do you find this shortcut? 
                    lets say instead of for an organizational unit (OU) we want a widget available for each project : on the website we navigate to any project and check the url :
                    https://demo.pqforce.com/change-factory?type=Project&id=9F4CEAB373094F13AF3A60BC12E81C54&partype=ProjectPortfolio&parid=A4A77FF37074460DAD456F43B56F4C37&feature=portfoliochart

                    and check the type -> here type is Project so we can replace  "HRM-RES-TYP-OU" with "Project" for objectType 
                        IMP!!!! It doesn't suffice to only change the objectType to another place since in the sandbox this is also defined so u need to change it in BOTH!!!!

        - headers : type -> content-type and value -> application/json

        - now we need to add authentification (ie a token which we need to create) (inherit?)

3. create token (api call " create token")
        - this is another API call but a POST one
        -so create new request : PUT https://demo.pqforce.com/API/V2/ACM/ApiToken/Create?tenantalias=change-factory
        - Body : {}
        -Auth : No auth
        - then execute this : u will get an API token and an API URL 
        - open the URL and login (this activates the token)
        - then go back to brave and copy the API token

4. Finish the PUT request (so go back to " Recreate JTF Widget From Forum")
        - now you have the token copied
        - click >> and go to Auth
        - select bearer token and copy in the token

5. now ur done and can run it -> (the arrow) if you get 200 OK then ur good
6. now go to the website and go to where the widget is supposed to be go to cockpit and search for the widget(name of widget is defined in the widget.obj.json)


Additional things we did->
Since we can use the same authenticator token always (or actually  until the expiration date) instead of always copying it we created an environment and defined variables for it :

        baseUrl : https://demo.pqforce.com 

        and 

        token as the token we produced 

        so now whenever we need the url or token we can use the variables "baseUrl" and "token"

    6. So we can go back to our previous API call 
    " Recreate JTF Widget From forum"
        - go to auth
        - now instead of bearer token we can use inherit and select Bearer token 
        - so now it is inheriting from "Test"

Tips
1. Print the client object 
2. Define which API calls you want (check format ie string, array?), check what it gives back in which format?

So the files 

1. To copy into the PUT API call: 


widget.obj.json: 
```json

{
	"type": "CockpitWidget",
	"id": "C501F4C74A044D329AF81C0DD9A4F736",
	"name": [
		{
			"code": "en",
			"text": "Resource List" //name of the widget 
        },
        {
            "code": "de",
            "text": "Ressourcenliste"
        }
	],
	"code": "EXAMPLE01",
	"description": [
		{
			"code": "en",
			"text": "Displays a list of resources."
        },
        {
            "code": "de",
            "text": "Zeigt eine Liste von Ressourcen an."
        }
	],
	"iconRef": [
		{
			"code": "en",
			"text": "/images/cockpit-table.png"
		}
	],
	"color": null,
	"validityStart": null,
	"validityUntil": null,
	"objectType": "HRM-RES-TYP-OU",
	"widgetType": "jtf",
	"definition": "{\r\n    \"source\": {\"category\": \"js\"},\r\n    \"config\": {\r\n        \"view\": \"table\",\r\n        \"lifecycle\": false,\r\n        \"colorscheme\": \"poly\",\r\n        \"decimals\": 0,\r\n        \"legend\": {\"show\": true,\"pos\": null},\r\n        \"showHeader\": true, \r\n        \"dateRange\": {\r\n           \"startDate\": { \"unit\": \"MONTH\", \"delta\": -2 },\r\n           \"duration\": { \"unit\": \"MONTH\", \"amount\": 2 }\r\n       },\r\n       \"properties\": [\r\n            { \r\n                \"id\": \"include_subOUs\", \r\n                \"name\": [\r\n                    { \"code\": \"en\", \"text\": \"Incl. Sub-OUs\"},\r\n                    { \"code\": \"de\", \"text\": \"Inkl. Sub-OUs\"}\r\n                ],\r\n                \"type\": \"checkbox\",\r\n                \"value\": false,\r\n                \"options\": {}\r\n            }\r\n        ],\r\n        \"chart_label\": true,\r\n        \"labels\": {\r\n            \"general\": true,\r\n            \"percentage\": true\r\n        }\r\n    },\r\n    \"options\": {\"disableFilter\": false,\"disableSorting\": true},\r\n    \"canReload\": true\r\n}",
	"sortIndex": 1,
	"tags": [
		[
			{
                "code": "en",
                "text": "Resources"
			},
            {
                "code": "de",
                "text": "Ressourcen"
            }
		]
	],
	"category": null,
	"sandboxId": "94F36F9798024E63AF8EAF58ED2AE5B2"  //change sandboxId 
} 
```json

2. resList.js to copy into JS sandbox 