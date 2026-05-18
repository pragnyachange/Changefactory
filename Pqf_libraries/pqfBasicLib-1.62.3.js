/**
 * @name PQFORCE Basic Library
 * @version 1.62.3
 * @file pqfBasicLib.js
 * @description This library contains various helpful functions that can serve
 * as a basis for JS automations. The functions are grouped in areas and thus
 * can be called like, e.g., utils.format.makeNumber()
 * @author DH (INTRASOFT), LI (INTRASOFT)
 * @pqfId e430d37e331848788acbf975d600dd8e
 * @created 2023-01-22
 * @modified 2026-03-09
 * @requires moment.js, lodash.js, json2html.js
 */

const pqfLib = (function () {
    "use strict";

    let _debuggingMode = 0;
    let _mockingMode = false;

    function _setDebuggingMode(debuggingMode) {
        _debuggingMode = debuggingMode;
        _log(1, "log", null, "Debugging mode: " + _debuggingMode);
    }

    function _setMockingMode(doMock) {
        _mockingMode = doMock;
        _log(1, "log", null, "Mocking mode: " + _mockingMode);
    }

    const _LANGUAGES_AVAILABLE = ["en", "de", "fr", "it"];

    const _DEFAULT_MAIL_PARAMS = {
        "skin": {
            "darkFontColor": "#07074E", // PQFORCE dark blue
            "lightFontColor": "#FFFFFF", // white
            "darkBackgroundColor": "#DB5656", // PQF red
            "lightBackgroundColor": "#F7F7F7", // light gray
            "testingAlertFontColor": "#FFFFFF", // white
            "testingAlertBackgroundColor": "#FF0000", // red
            "logoSrc": "https://www.pqforce.com/logo-colour-a.png",
            "logoLink": "https://www.pqforce.com",
            "logoAlt": "PQFORCE Logo",
            "logoScale": 1.0,
            "logoDefaultHeight": 20.0,
            "bodyMessageMode": "plain",
            "textAlign": "center",
            "testing": false
        },

        "simpleHtmlTemplate": "<h3>[[Title]]</h3><p>[[Intro]]</p><p>[[Message]]</p><p>[[Outro]]</p>",

        "headerHtmlTestingAlertTemplate": "<table align=\"center\" style=\"background: [[TestingAlertBackgroundColor]]; width: 100%;\"><tbody><tr><td style=\"height: 10px\">&nbsp;<\/td><\/tr><tr><td align=\"center\" style=\"text-align: center;\"><div style=\"font-family: 'Work Sans', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; color: [[TestingAlertFontColor]];\"><p style=\"font-family: 'Work Sans', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; color: [[TestingAlertFontColor]];\">[[TestingAlertMessage]]<\/p><\/div><\/td><\/tr><tr><td style=\"height: 10px\">&nbsp;<\/td><\/tr><\/tbody><\/table>",
        // contains placeholders: [[TestingAlertBackgroundColor]], [[TestingAlertFontColor]], [[TestingAlertMessage]]

        "headerHtmlTemplate": "<table align=\"center\" style=\"background: [[HeaderBackgroundColor]]; width: 100%;\"><tbody><tr><td style=\"height: 10px\">&nbsp;<\/td><\/tr><tr><td align=\"center\" style=\"text-align: center;\"><a href=\"[[LogoLink]]\" target=\"_blank\"><img height=\"[[LogoHeight]]\" alt=\"[[LogoAlt]]\" src=\"[[LogoSrc]]\" style=\"border:0;outline:none;text-decoration:none;height:auto;font-size:13px;\"\/><\/a><\/td><\/tr><tr><td style=\"height: 10px\">&nbsp;<\/td><\/tr><\/tbody><\/table>",
        // contains placeholders: [[TextAlign]], [[HeaderBackgroundColor]], [[LogoLink]], [[LogoSrc]], [[LogoAlt]], [[LogoHeight]]

        "bodyHtmlTemplate": "<table align=\"[[TextAlign]]\" style=\"background: [[BodyBackgroundColor]]; width: 100%;\"><tbody><tr><td style=\"height: 10px\">&nbsp;<\/td><td style=\"height: 10px\">&nbsp;<\/td><td style=\"height: 10px\">&nbsp;<\/td><\/tr><tr><td>&nbsp;<\/td><td align=\"[[TextAlign]]\" style=\"text-align: [[TextAlign]]; width: 600px;\"><p style=\"font-family: 'Work Sans', Helvetica, Arial, sans-serif; font-size: 20px; color: [[BodyTitleFontColor]]; font-weight: 400;\"><b>[[Title]]<\/b><\/p><p style=\"font-family: 'Work Sans', Helvetica, Arial, sans-serif; font-size: 16px; color: [[BodyIntroFontColor]]; font-weight: 400;\">[[Intro]]<\/p>[[MessageBox]]<p style=\"font-family: 'Work Sans', Helvetica, Arial, sans-serif; font-size: 16px; color: [[BodyOutroFontColor]]; font-weight: 400;\">[[Outro]]<\/p><\/td><td>&nbsp;<\/td><\/tr><tr><td style=\"height: 10px\">&nbsp;<\/td><td style=\"height: 10px\">&nbsp;<\/td><td style=\"height: 10px\">&nbsp;<\/td><\/tr><\/tbody><\/table>",
        // contains placeholders: [[TextAlign]], [[BodyBackgroundColor]], [[BodyTitleFontColor]], [[Title]], [[BodyIntroFontColor]], [[Intro]], [[MessageBox]], [[BodyOutroFontColor]], [[Outro]]

        "bodyHtmlVerticalSeparator": "<table style=\"background-color: [[color]];\"><tr><td style=\"height: 5px\">&nbsp;<\/td><\/tr><\/table>",
        // contains placeholders: none

        "bodyHtmlHorizontalLine": "<table><tr><td style=\"background:none; text-align: center; width: 400px; height:1px; border: dotted 1px [[color]]; border-width: 1px 0 0 0; margin: 0px 0px 0px 0px; padding-top:0px; padding-bottom:0px; font-size:0%;\">&nbsp;<\/td><\/tr><\/table>",
        // contains placeholders: none

        "bodyHtmlMessageDarkBox": "<table style=\"background-color: [[BodyMessageBackgroundColor]];\"><tr><td style=\"height: 5px\">&nbsp;<\/td><td style=\"height: 5px\">&nbsp;<\/td><td style=\"height: 5px\">&nbsp;<\/td><\/tr><tr><td style=\"width: 10px;\">&nbsp;<\/td><td align=\"[[TextAlign]]\" style=\"text-align: [[TextAlign]]; width: 580px;\"><div style=\"font-family: 'Work Sans', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; color: [[BodyMessageFontColor]];\"><p style=\"font-family: 'Work Sans', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; color: [[BodyMessageFontColor]];\">[[Message]]<\/p><\/div><\/td><td style=\"width: 10px;\">&nbsp;<\/td><\/tr><tr><td style=\"height: 5px\">&nbsp;<\/td><td style=\"height: 5px\">&nbsp;<\/td><td style=\"height: 5px\">&nbsp;<\/td><\/tr><\/table>",
        // contains placeholders: [[TextAlign]], [[BodyMessageBackgroundColor]], [[BodyMessageFontColor]], [[Message]]

        "bodyHtmlMessageLightBox": "<table style=\"background-color: [[BodyMessageBackgroundColor]];\"><tr><td style=\"height: 5px\">&nbsp;<\/td><\/tr><tr><td align=\"[[TextAlign]]\" style=\"text-align: [[TextAlign]]; width: 600px;\"><div style=\"font-family: 'Work Sans', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; color: [[BodyMessageFontColor]];\"><p style=\"font-family: 'Work Sans', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; color: [[BodyMessageFontColor]];\">[[Message]]<\/p><\/div><\/td><\/tr><tr><td style=\"height: 5px\">&nbsp;<\/td><\/tr><\/table>",
        // contains placeholders: [[TextAlign]], [[BodyMessageBackgroundColor]], [[BodyMessageFontColor]], [[Message]]

        "bodyHtmlMessagePlain": "<div style=\"font-family: 'Work Sans', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; color: [[BodyMessageFontColor]];\"><p style=\"font-family: 'Work Sans', Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; color: [[BodyMessageFontColor]];\">[[Message]]<\/p><\/div>",
        // contains placeholders: [[BodyMessageFontColor]], [[Message]]

        "footerHtmlTemplate": "<table align=\"center\" style=\"background: [[FooterBackgroundColor]]; width: 100%;\"><tbody>[[FooterExtraContent]]<tr><td style=\"height: 10px\">&nbsp;<\/td><td style=\"height: 10px\">&nbsp;<\/td><td style=\"height: 10px\">&nbsp;<\/td><\/tr><tr><td>&nbsp;<\/td><td align=\"center\" style=\"width: 600px;\"><p style=\"font-family: 'Work Sans', Helvetica, Arial, sans-serif; font-size: 8px; font-weight: 400; color: [[FooterFontColor]];\">[[FooterTextLine1]]<\/p><p style=\"font-family: 'Work Sans', Helvetica, Arial, sans-serif; font-size: 8px; font-weight: 400; color: [[FooterFontColor]];\">[[FooterTextLine2]]<\/p><\/td><td>&nbsp;<\/td><\/tr><tr><td style=\"height: 10px\">&nbsp;<\/td><td style=\"height: 10px\">&nbsp;<\/td><td style=\"height: 10px\">&nbsp;<\/td><\/tr><\/tbody><\/table>",
        // contains placeholders: [[TextAlign]], [[FooterBackgroundColor]], [[FooterExtraContent]], [[FooterFontColor]], [[FooterTextLine1]], [[FooterTextLine2]]

        "footerExtraContentHtmlTemplate": "<tr><td style=\"height: 10px\">&nbsp;<\/td><td style=\"height: 10px\">&nbsp;<\/td><td style=\"height: 10px\">&nbsp;<\/td><\/tr><tr><td>&nbsp;<\/td><td align=\"center\" style=\"text-align: center; width: 600px;\"><table align=\"center\"><tbody><tr><td align=\"center\" valign=\"middle\" style=\"text-align: center;\"><a href=\"https:\/\/www.pqforce.com\/\" target=\"_blank\"><img height=\"20\" width=\"20\" alt=\"PQFORCE Website\" src=\"https:\/\/pqforce.com\/pq-sitelink.png\" style=\"border-radius: 3px; height: 20px; width: 20px; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; border-width: 0;\"\/><\/a><\/td><td style=\"width: 10px\">&nbsp;<\/td><td align=\"center\" valign=\"middle\" style=\"text-align: center;\"><a href=\"https:\/\/twitter.com\/pqforce\" target=\"_blank\"><img height=\"20\" width=\"20\" alt=\"PQFORCE on Twitter\" src=\"https:\/\/pqforce.com\/pq-twitter.png\" style=\"border-radius: 3px; height: 20px; width: 20px; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; border-width: 0;\"\/><\/a><\/td><td style=\"width: 10px\">&nbsp;<\/td><td align=\"center\" valign=\"middle\" style=\"text-align: center;\"><a href=\"https:\/\/www.linkedin.com\/company\/intrasoft-ag\/\" target=\"_blank\"><img height=\"20\" width=\"20\" alt=\"PQFORCE on LinkedIn\" src=\"https:\/\/pqforce.com\/pq-linkedin.png\" style=\"border-radius: 3px; height: 20px; width: 20px; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; border-width: 0;\"\/><\/a><\/td><\/tr><\/tbody><\/table><\/td><td>&nbsp;<\/td><\/tr>",
        // contains PQFORCE, LinkedIn and Twitter logos and links, but no placeholders

        "footerTextLines": [
            "Diese Serviceemail wurde Ihnen gesendet bezüglich einer Notifikation zu Ihrem PQFORCE Login. Bitte wenden Sie sich an Ihren Administrator, falls Sie keine Notifikationsemails mehr erhalten wollen. PQFORCE wird von INTRASOFT AG, Rothusstrasse 15, CH-6331 Hünenberg bereitgestellt.",
            "© INTRASOFT, alle Rechte vorbehalten."
        ],

        "messageForLifecycleDecision": "<p><b>[[ObjectType]]</b>: <a href=\"[[ObjectUrl]]\" style=\"color: [[BodyMessageFontColor]];\">[[ObjectName]]</a></p><p><b>[[StateLabelBefore]]</b>: [[StateNameBefore]]</p><p><b>[[StateLabelNow]]</b>: [[StateNameNow]]</p><p><b>[[CommentLabel]]</b>: [[Comment]]</p>",
        // contains placeholders: [[ObjectType]], [[ObjectName]], [[ObjectUrl]], [[StateLabelBefore]], [[StateNameBefore]], [[StateLabelNow]], [[StateNameNow]], [[CommentLabel]], [[Comment]]

        "messageForLifecycleComments": "<p><b>[[ObjectType]]</b>: <a href=\"[[ObjectUrl]]\" style=\"color: [[BodyMessageFontColor]];\">[[ObjectName]]</a></p><p><b>[[StateLabel]]</b>: [[StateName]]</p><p><b>[[CommentLabel]]</b>: [[Comment]]</p>",
        // contains placeholders: [[ObjectType]], [[ObjectName]], [[ObjectUrl]], [[StateLabel]], [[StateName]], [[CommentLabel]], [[Comment]]

        "projectLifecycleDecision": {
            "objectType": "Projekt",
            "stateLabelBefore": "Zustand vorher",
            "stateLabelNow": "Zustand jetzt"
        },

        "projectLifecycleComment": {
            "objectType": "Projekt",
            "stateLabel": "Aktueller Zustand"
        },

        "changerequestLifecycleDecision": {
            "objectType": "Änderungsantrag",
            "stateLabelBefore": "Zustand vorher",
            "stateLabelNow": "Zustand jetzt"
        },

        "changerequestLifecycleComment": {
            "objectType": "Projekt",
            "stateLabel": "Aktueller Zustand"
        },

        "testingAlertMessage": "THIS IS JUST A TEST MAIL. IT CAN SAFELY BE IGNORED."
    };

    const JSON2HTML_LOG_TEMPLATE = {
        "<>": "li",
        "style": "font-size: 80%;",
        "html": [{
                "<>": "b",
                "text": "${user}, ${timestamp}"
            }, {
                "<>": "ul",
                "html": [{
                        "<>": "li",
                        "{}": function () {
                            return (this.processingInfo);
                        },
                        "html": [{
                                "html": "${action}"
                            }
                        ]
                    }, {
                        "<>": "li",
                        "{}": function () {
                            return (this.processingInfo);
                        },
                        "html": [{
                                "html": "${message}"
                            }
                        ]
                    }
                ]
            }
        ]
    };

    // Simple Cache for API results to avoid multiple calls for the same data

    let dimensionDefs = {};
    let statusClassDefs = {};
    let propertyDefs = {};
    let pmMethods = null;
    let pmMethodPhases = null;

    function _getSimpleCacheData(cacheName, keys) {
        let key = JSON.stringify(keys);
        switch (cacheName) {
            case "dimensionDefs":
                if (!dimensionDefs[key]) {
                    dimensionDefs[key] = _exec(Pqf.pm, Pqf.pm.getIndicatorDimensionDef, keys.repType, keys.dimension);
                }
                return dimensionDefs[key];
            case "statusClassDefs":
                if (!statusClassDefs[key]) {    
                    statusClassDefs[key] = _exec(Pqf.pm, Pqf.pm.getIndicatorClassification, keys.statusClassId);
                }
                return statusClassDefs[key];
            case "propertyDefs":
                if (!propertyDefs[key]) {
                    propertyDefs[key] = _exec(Pqf.pf, Pqf.pf.getPropertyDefinitions, keys.objType);
                }
                return propertyDefs[key];
            case "pmMethods":
                if (!pmMethods) {
                    pmMethods = _exec(Pqf.pm, Pqf.pm.getPmMethods);
                }
                return pmMethods;
            case "pmMethodPhases":
                if (!pmMethodPhases) {
                    pmMethods = _getSimpleCacheData("pmMethods");
                    pmMethodPhases = pmMethods.reduce((acc, method) => {
                        let methodPhases_thisMethod = _exec(Pqf.pm, Pqf.pm.getPmMethodPhases, method.id);
                        acc = acc.concat(methodPhases_thisMethod);
                        return acc;
                    }, []);
                }
                return pmMethodPhases;
        }
    }

    /**
     *
     * @param {*} mySkin
     * @param {*} extraFooterContent
     */
    function _setMailTemplateParams(mySkin, extraFooterContent) {
        mySkin = (typeof mySkin !== "undefined" ? mySkin : null); // optional argument, default: mySkin = null
        extraFooterContent = (typeof extraFooterContent !== "undefined" && extraFooterContent !== null ? extraFooterContent : null); // optional argument, default: extraFooterContent = null

        let skin = _DEFAULT_MAIL_PARAMS.skin;
        if (mySkin) {
            // override default skin parameters
            for (let prop in skin) {
                if (Object.prototype.hasOwnProperty.call(skin, prop)) {
                    if (Object.prototype.hasOwnProperty.call(mySkin, prop) && mySkin[prop]) {
                        skin[prop] = mySkin[prop];
                        if (prop === "testing" && mySkin[prop] && typeof mySkin[prop] === "string") { // Set test message header
                            _DEFAULT_MAIL_PARAMS.testingAlertMessage = mySkin[prop];
                        }
                    }
                }
            }
        }
        if (extraFooterContent) {
            _DEFAULT_MAIL_PARAMS.footerExtraContentHtmlTemplate = extraFooterContent;
        }
    }

    function _prepareMailTemplate(mailType, skin, footerExtraContent, footerTextLines) {
        mailType = (typeof mailType !== "undefined" ? mailType : "notification"); // optional argument, default: mailType = "notification"
        footerExtraContent = (typeof footerExtraContent !== "undefined" ? footerExtraContent : _DEFAULT_MAIL_PARAMS.footerExtraContentHtmlTemplate); // optional argument, default: footerExtraContent = PQFORCE, LinkedIn and Twitter logos
        footerTextLines = (typeof footerTextLines !== "undefined" ? footerTextLines : _DEFAULT_MAIL_PARAMS.footerTextLines); // optional argument, default: footerTextLines = PQFORCE disclaimer

        if (typeof skin !== "undefined" && skin !== null) {
            _setMailTemplateParams(skin);
        }
        skin = _DEFAULT_MAIL_PARAMS.skin;

        // Prepare basic mail template for each mail type
        let template = "";
        switch (mailType) {
        case "simple":
            template += _DEFAULT_MAIL_PARAMS.simpleHtmlTemplate;
            break;
        case "report":
            break;
        default:
            if (skin.testing) {
                template += _DEFAULT_MAIL_PARAMS.headerHtmlTestingAlertTemplate;
            }
            template += _DEFAULT_MAIL_PARAMS.headerHtmlTemplate;
            template += _DEFAULT_MAIL_PARAMS.bodyHtmlTemplate;
            template += _DEFAULT_MAIL_PARAMS.footerHtmlTemplate;
        }

        switch (skin.bodyMessageMode) {
        case "dark":
            template = _replaceAll(template, "[[MessageBox]]", _DEFAULT_MAIL_PARAMS.bodyHtmlMessageDarkBox);
            break;
        case "light":
            template = _replaceAll(template, "[[MessageBox]]", _DEFAULT_MAIL_PARAMS.bodyHtmlMessageLightBox);
            break;
        default: // includes "plain"
            template = _replaceAll(template, "[[MessageBox]]", _DEFAULT_MAIL_PARAMS.bodyHtmlMessagePlain);
        }

        // Refine mail template for certain mail types
        switch (mailType) {
        case "lifecycleDecisionProject":
            template = _replaceAll(template, "[[Message]]", _DEFAULT_MAIL_PARAMS.messageForLifecycleDecision);
            template = _replaceAll(template, "[[ObjectType]]", _DEFAULT_MAIL_PARAMS.projectLifecycleDecision.objectType);
            template = _replaceAll(template, "[[StateLabelBefore]]", _DEFAULT_MAIL_PARAMS.projectLifecycleDecision.stateLabelBefore);
            template = _replaceAll(template, "[[StateLabelNow]]", _DEFAULT_MAIL_PARAMS.projectLifecycleDecision.stateLabelNow);
            break;
        case "lifecycleCommentProject":
            template = _replaceAll(template, "[[Message]]", _DEFAULT_MAIL_PARAMS.messageForLifecycleComments);
            template = _replaceAll(template, "[[ObjectType]]", _DEFAULT_MAIL_PARAMS.projectLifecycleDecision.objectType);
            template = _replaceAll(template, "[[StateLabel]]", _DEFAULT_MAIL_PARAMS.projectLifecycleComment.stateLabel);
            break;
        case "lifecycleDecisionChangeRequest":
            template = _replaceAll(template, "[[Message]]", _DEFAULT_MAIL_PARAMS.messageForLifecycleDecision);
            template = _replaceAll(template, "[[ObjectType]]", _DEFAULT_MAIL_PARAMS.changerequestLifecycleDecision.objectType);
            template = _replaceAll(template, "[[StateLabelBefore]]", _DEFAULT_MAIL_PARAMS.changerequestLifecycleDecision.stateLabelBefore);
            template = _replaceAll(template, "[[StateLabelNow]]", _DEFAULT_MAIL_PARAMS.changerequestLifecycleDecision.stateLabelNow);
            break;
        case "lifecycleCommentChangeRequest":
            template = _replaceAll(template, "[[Message]]", _DEFAULT_MAIL_PARAMS.messageForLifecycleComments);
            template = _replaceAll(template, "[[ObjectType]]", _DEFAULT_MAIL_PARAMS.changerequestLifecycleComment.objectType);
            template = _replaceAll(template, "[[StateLabel]]", _DEFAULT_MAIL_PARAMS.changerequestLifecycleComment.stateLabel);
            break;
        }

        // Finally, replace styling placeholders
        if (skin.testing) {
            template = _replaceAll(template, "[[TestingAlertBackgroundColor]]", skin.testingAlertBackgroundColor);
            template = _replaceAll(template, "[[TestingAlertFontColor]]", skin.testingAlertFontColor);
            template = _replaceAll(template, "[[TestingAlertMessage]]", _DEFAULT_MAIL_PARAMS.testingAlertMessage);
        }
        template = _replaceAll(template, "[[HeaderBackgroundColor]]", skin.lightBackgroundColor);
        template = _replaceAll(template, "[[TextAlign]]", skin.textAlign);
        template = _replaceAll(template, "[[LogoLink]]", skin.logoLink);
        template = _replaceAll(template, "[[LogoSrc]]", skin.logoSrc);
        template = _replaceAll(template, "[[LogoAlt]]", skin.logoAlt);
        template = _replaceAll(template, "[[LogoHeight]]", skin.logoScale * skin.logoDefaultHeight);
        template = _replaceAll(template, "[[BodyBackgroundColor]]", "#FFFFFF");
        template = _replaceAll(template, "[[BodyTitleFontColor]]", skin.darkFontColor);
        template = _replaceAll(template, "[[BodyIntroFontColor]]", skin.darkFontColor);
        template = _replaceAll(template, "[[BodyOutroFontColor]]", skin.darkFontColor);
        switch (skin.bodyMessageMode) {
        case "dark":
            template = _replaceAll(template, "[[BodyMessageBackgroundColor]]", skin.darkBackgroundColor);
            template = _replaceAll(template, "[[BodyMessageFontColor]]", skin.lightFontColor);
            break;
        default: // includes "light", "plain"
            template = _replaceAll(template, "[[BodyMessageBackgroundColor]]", "#FFFFFF");
            template = _replaceAll(template, "[[BodyMessageFontColor]]", skin.darkFontColor);
        }
        template = _replaceAll(template, "[[FooterBackgroundColor]]", skin.lightBackgroundColor);
        template = _replaceAll(template, "[[FooterFontColor]]", skin.darkFontColor);
        template = _replaceAll(template, "[[FooterExtraContent]]", footerExtraContent);
        template = _replaceAll(template, "[[FooterTextLine1]]", _DEFAULT_MAIL_PARAMS.footerTextLines[0]);
        template = _replaceAll(template, "[[FooterTextLine2]]", _DEFAULT_MAIL_PARAMS.footerTextLines[1]);

        return template;
    }

    function _getTenantAlias() {
        return Pqf.pf.getCurrentTenant().alias;
    }

    function _getTenantUrl() {
        return Pqf.main.getStartUrl();
    }

    function _getCurrentUser() {
        return _getUserWithResource(null);
    }

    function _getUserWithResource(userId) {
        let pqfUser = null;
        if (userId) {
            try {
                pqfUser = Pqf.acm.getUser(userId);
            } catch (err) {
                _log(1, "warn", null, "User with id " + userId + " not found. Maybe deleted?");
                return null;
            }
        } else {
            pqfUser = Pqf.acm.getCurrentUser();
        }
        let user = {
            "userId": pqfUser.id,
            "userName": pqfUser.name,
            "userEmail": pqfUser.email,
            "userMobile": pqfUser.mobile,
            "userNotify": pqfUser.receiveNotifications,
            "resourceId": null,
            "resourceName": null,
            "resourceEmail": null
        };
        if (pqfUser.resource) { // user has a resource assigned
            user.resourceId = pqfUser.resource.id;
            user.resourceName = pqfUser.resource.name;
            user.resourceEmail = pqfUser.resource.eMail;
        }
        return user;
    }

    function _getCurrentUserName() {
        let currentUser = Pqf.acm.getCurrentUser();
        let name = currentUser.name;
        let resource = currentUser.resource;
        if (resource) {
            name = resource.name + " (" + name + ")";
        }
        return name;
    }

    function _translate(texts) {
        let usr = Pqf.acm.getCurrentUser();
        let language = usr.language.slice(0, 2);
        return texts[language] || texts.en;
    }

    function _makeNumber(value) {
        if (value == null || isNaN(value)) {
            return 0.0;
        }
        return Number(value);
    }

    function _printNumber(number, digits, thousandsSeparator, decimalSeparator) {
        if (number === null || number === undefined) return number;
        if (typeof digits === "number") number = _round(number, digits);
        const parts = String(number).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator || "'");
        return parts.join(decimalSeparator || '.');
    }

    function _round(number, digits) {
        return Math.round((number + Number.EPSILON) * Math.pow(10, digits)) / Math.pow(10, digits);
    }

    function _stripHtml(html) {
        if (typeof html === "string" || html instanceof String) {
            return html.replace(/(<([^>]+)>)/gi, " ").trim();
        } else {
            return html;
        }
    }

    function _encode(obj) {
        if (obj) {
            return Array.from(JSON.stringify(obj)).map(char => {
                return char.codePointAt(0).toString(16);
            }).join(",");
        } else {
            return null;
        }
    }

    function _decode(str) {
        if (str) {
            return JSON.parse(str.split(",").map(code => {
                    return String.fromCodePoint(parseInt(code, 16));
                }).join(""));
        } else {
            return null;
        }
    }

    function _getTime(timeString, format) {
        format = typeof format !== "undefined" ? format : "HH:mm:ss";
        if (timeString) {
            return moment(timeString).format(format);
        } else {
            return moment().format(format);
        }
    }

    function _getDate(dateString, format) {
        format = typeof format !== "undefined" ? format : "DD.MM.YYYY";
        if (dateString) {
            return moment(dateString).format(format);
        } else {
            return moment().format(format);
        }
    }

    function _currentHour() {
        return _getTime(null, "HH");
    }

    function _currentDay() {
        return _getDate(null, "DD");
    }

    function _getPeriodHumanReadable(startDate, endDate) {
        if (!startDate.isValid() || !endDate.isValid()) {
            return "Invalid dates";
        }

        // Check for full year
        if (startDate.isSame(startDate.clone().startOf('year'), 'day') && endDate.isSame(startDate.clone().endOf('year'), 'day')) {
            return startDate.format("YYYY");
        }

        // Check for semester
        const firstSemester = startDate.month() === 0 && endDate.month() === 5 && endDate.isSame(startDate.clone(), 'year');
        const secondSemester = startDate.month() === 6 && endDate.month() === 11 && endDate.isSame(startDate.clone(), 'year');

        if (firstSemester || secondSemester) {
            return `${startDate.format("YYYY")} Sem ${firstSemester ? "1" : "2"}`;
        }

        // Check for quarter
        if (startDate.isSame(startDate.clone().startOf('quarter'), 'day') && endDate.isSame(startDate.clone().endOf('quarter'), 'day')) {
            return `Q${startDate.quarter()} ${startDate.format("YYYY")}`;
        }

        // Check for one full month
        if (startDate.isSame(startDate.clone().startOf('month'), 'day') && endDate.isSame(startDate.clone().endOf('month'), 'day')) {
            return startDate.format("MMM YYYY");
        }

        // Check for several full months
        if (startDate.isSame(startDate.clone().startOf('month'), 'day') && endDate.isSame(endDate.clone().endOf('month'), 'day')) {
            if (startDate.isSame(endDate, 'year')) {
                return `${startDate.format("MMM")}-${endDate.format("MMM")} ${endDate.format("YYYY")}`;
            } else {
                return `${startDate.format("MMM")} ${startDate.format("YYYY")} - ${endDate.format("MMM")} ${endDate.format("YYYY")}`;
            }
        }

        // Default case (if no specific period matches)
        if (startDate.isSame(endDate, 'year')) {
            if (startDate.isSame(endDate, 'month')) {
                return `${startDate.format("DD.")}-${endDate.format("DD.MM.YYYY")}`;
            } else {
                return `${startDate.format("DD.MM.")}-${endDate.format("DD.MM.YYYY")}`;
            }
        } else {
            return `${startDate.format("DD.MM.YYYY")}-${endDate.format("DD.MM.YYYY")}`;
        }
    }
    function _escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
    }

    function _sanitizeString(string, removeSpecialChars) {
        removeSpecialChars = typeof removeSpecialChars !== "undefined" ? removeSpecialChars : false;
        if (string) {
            string = Pqf.clf.sanitizeHtml(string);
            if (removeSpecialChars) {
                const regex = /[^\x00-\x7F]/g;
                string = string.replace(regex, "");
            }
        }
        return string;
    }

    function _getUrlComponents() {
        let components = Pqf.main.getStartUrl().match(/(http[s]?):\/\/([^\/\s]+)\/(.*)/);
        return {
            "protocol": components[1],
            "host": components[2],
            "alias": components[3]
        };
    }

    function _replaceAll(str, find, replace) {
        return str.replace(new RegExp(_escapeRegExp(find), "g"), replace);
    }

    function _getUsersFromResourceIds(resourceIds, excludeCurrentUser, includeWithoutUsers) {
        // Note: If excludeCurrentUser is true (default is false), then all resources that are equal to the current user's resource are excluded
        excludeCurrentUser = typeof excludeCurrentUser !== "undefined" ? excludeCurrentUser : false;
        includeWithoutUsers = typeof includeWithoutUsers !== "undefined" ? includeWithoutUsers : false;
        let userList = [];
        if (resourceIds && resourceIds.length > 0) {
            resourceIds.filter(id => id == null ? false : true).forEach(function (resourceId) {
                let resource = Pqf.res.getResource(resourceId);
                let users = Pqf.acm.getUsers(null, resourceId, null, null);
                users.forEach(function (user) {
                    userList.push({
                        "userId": user.id,
                        "userName": user.name,
                        "userEmail": user.email,
                        "userNotify": user.receiveNotifications,
                        "resourceId": resource.id,
                        "resourceName": resource.name,
                        "resourceEmail": resource.eMail,
						"resourceUrl": Pqf.main.getObjectUrl(resource.type, resource.id)
                    });
                });
                if (excludeCurrentUser) {
                    let currentUser = _getCurrentUser();
                    userList = userList.filter(user => user.userId != currentUser.userId);
                }
                if (includeWithoutUsers && (!users || users.length == 0)) { // add resource without user if no users were found
                    userList.push({
                        "userId": null,
                        "userName": null,
                        "userEmail": null,
                        "userNotify": true, // Set so that resource will be notified via its email if this object is used in notifications
                        "resourceId": resource.id,
                        "resourceName": resource.name,
                        "resourceEmail": resource.eMail,
						"resourceUrl": Pqf.main.getObjectUrl(resource.type, resource.id)
                    });
                }
            });
        }
        return userList;
    }

    function _getResourcesFromRelationTypeId(relationTypeId, sourceType, sourceId, targetTypes) {
        let relations = Pqf.pf.getForwardRelations(sourceType, sourceId, null, null, relationTypeId, false);
        let resourceIds = relations.map(rel => rel.target.id);
        let resources = [];
        targetTypes.forEach(function (targetType) {
            resources = resources.concat(Pqf.res.getResourcesByType(targetType).filter(res => resourceIds.includes(res.id)));
        });
        return resources;
    }

    function _getUsersFromRelationTypeId(relationTypeId, sourceType, sourceId, excludeCurrentUser, includeImplicit) {
        excludeCurrentUser = typeof excludeCurrentUser !== "undefined" ? excludeCurrentUser : false;
        includeImplicit = typeof includeImplicit !== "undefined" ? includeImplicit : false;
        let relations = Pqf.pf.getForwardRelations(sourceType, sourceId, null, null, relationTypeId, includeImplicit);
        let resourceIds = relations.map(rel => rel.target.id);
        let userList = [];
        if (resourceIds && resourceIds.length > 0) {
            userList = _getUsersFromResourceIds(resourceIds, excludeCurrentUser);
        }
        return userList;
    }

    function _getUsersFromRoleId(roleId, excludeCurrentUser) {
        excludeCurrentUser = typeof excludeCurrentUser !== "undefined" ? excludeCurrentUser : false;
        let users = Pqf.acm.getUsers(null, null, null, null);
        if (excludeCurrentUser) {
            let currentUser = _getCurrentUser();
            users = users.filter(usr => usr.id != currentUser.userId);
        }
        let resourceIds = users.filter(function (user) {
            let roles = Pqf.acm.getUserRoleAssignments(user.id);
            return (roles.map(role => role.id).includes(roleId) ? true : false);
        }).map(function (user) {
            return (user.resource ? user.resource.id : null);
        }).filter(res => res !== null);
        let userList = [];
        if (resourceIds && resourceIds.length > 0) {
            userList = _getUsersFromResourceIds(resourceIds, excludeCurrentUser);
        }
        return userList;
    }

    function _autoApprove(allocation, resourceTypes, parentResourceTypes, parentResourceRelationTypes, projectRelationTypes, approvalRemark) {
        resourceTypes = typeof resourceTypes !== "undefined" ? resourceTypes : ["HRM-RES-TYP-EMP"];
        parentResourceTypes = typeof parentResourceTypes !== "undefined" ? parentResourceTypes : ["HRM-RES-TYP-OU"];
        parentResourceRelationTypes = typeof parentResourceRelationTypes !== "undefined" ? parentResourceRelationTypes : null;
        projectRelationTypes = typeof projectRelationTypes !== "undefined" ? projectRelationTypes : null;
        approvalRemark = typeof approvalRemark !== "undefined" ? approvalRemark : "Auto-approval";
        let allocatedResource = null;
        try {
            allocatedResource = Pqf.res.getResource(allocation.resourceId);
        } catch (err) {
            _log(1, "warn", "03C3772CFDC84DDAB5B0CB6BC567FA16", "Cannot get resource with resource ID " + allocation.resourceId);
        }
        if (allocatedResource && resourceTypes.includes(allocation.resourceType)) {
            let parentRelationResources = [];
            if (parentResourceRelationTypes) {
                // Get all resources that have the relevant relation to ANY of the ancestor resources
                let ancestors = Pqf.res.getResourceAncestors(allocation.resourceId);
                ancestors.forEach(function (ancestor) {
                    if (parentResourceTypes.includes(ancestor.type)) {
                        let tmpResourceIds = [];
                        parentResourceTypes.forEach(function (parentResourceType) {
                            parentResourceRelationTypes.forEach(function (parentResourceRelationType) {
                                tmpResourceIds = tmpResourceIds.concat(pqfLib.resources.getUsersFromRelationTypeId(parentResourceRelationType, parentResourceType, ancestor.id).map(x => x.resourceId));
                            });
                        });
                        parentRelationResources = parentRelationResources.concat(tmpResourceIds);
                    }
                });
            }
            let user = pqfLib.resources.getUserWithResource(allocation.createdBy.id);
            if (!parentResourceRelationTypes || parentRelationResources.includes(user.resourceId)) {
                let projectRelationUsers = [];
                if (projectRelationTypes) {
                    let project = Pqf.pm.getProject(allocation.projectId);
                    projectRelationTypes.forEach(function (projectRelationType) {
                        projectRelationUsers = projectRelationUsers.concat(pqfLib.resources.getUsersFromRelationTypeId(projectRelationType, "Project", project.id).map(x => x.resourceId));
                    });
                }
                if (!projectRelationTypes || projectRelationUsers.includes(user.resourceId)) {
                    if (["ALLOC_STATE_NEW", "ALLOC_STATE_CHANGED"].includes(allocation.state)) {
                        _debuggingMode ? console.log("Auto-approval for new or changed allocation " + allocation.id + " of resource " + allocatedResource.name) : null;
                        try {
                            Pqf.alc.requestResourceAllocation(allocation.id, approvalRemark, true);
                        } catch (err) {
                            console.error(err);
                        }
                    } else if (allocation.state === "ALLOC_STATE_REQUESTED") {
                        _debuggingMode ? console.log("Auto-approval for requested allocation " + allocation.id + " of resource " + allocatedResource.name) : null;
                        try {
                            Pqf.alc.approveResourceAllocation(allocation.id, approvalRemark);
                        } catch (err) {
                            console.error(err);
                        }
                    } else {
                        _debuggingMode ? console.log("No auto-approval for allocation " + allocation.id + " in state " + allocation.state + " of resource " + allocatedResource.name) : null;
                    }
                } else {
                    _debuggingMode ? console.log("No auto-approval of resource " + allocatedResource.name + " because user has no relation type in [" + projectRelationTypes.join(", ") + "] to project") : null;
                }
            } else {
                _debuggingMode ? console.log("No auto-approval of resource " + allocatedResource.name + " because user has no relation type in  [" + parentResourceRelationTypes.join(", ") + "] to parent resource") : null;
            }
        } else {
            _debuggingMode ? console.log("No auto-approval of resource " + allocatedResource.name + " of type " + allocation.resourceType) : null;
        }
    }

    function _getLatestReport(reports) {
        let latestReport = null;
        let latestReportDate = moment("0001-01-01");
        reports.forEach(function (report) {
            let currentReportDate = moment(report.modifiedAt);
            if (currentReportDate > latestReportDate) {
                latestReportDate = currentReportDate;
                latestReport = report;
            }
        });
        return latestReport;
    }

    function _portfolioSnapshot(projectFilter, dataFilter, options) {
        // Arguments:
        // 	- projectFilter.portfolios : Array of portfolio IDs
        //  - projectFilter.states : Array of lifecycle state IDs
        //
        //  - dataFilter.basics : Array of strings from ["code", "name", "desc", "state", "portfolios"]
        //  - dataFilter.classifications : Array of classification IDs
        //  - dataFilter.costs : Array of strings from ["plan", "budget", "actual", "forecast"]
        //  - dataFilter.latestReports : Array of { "reportTypeId": ..., "dimensions": [...], "properties": [...] }
        //
        //  - options.currency : ID of the currency for which costs are calculated
        //  - options.categories : Array of additional categories of type {"id": ..., "label": ...}

        // ----------------------------
        // Fetch and filter projects
        // ----------------------------
        let allStates = Pqf.lcy.getTypeReachableStates("Project");
        let allProjects = Pqf.pm.getProjects();
        let filteredProjects =
            _.filter(_.filter(allProjects, p => _.intersection(p.portfolios.map(pf => pf.id), projectFilter.portfolios).length), p => projectFilter.states.includes(p.status));

        // ----------------------------
        // Prepare data columns
        // ----------------------------
        let columns = [];
        if (!dataFilter.basics) {
            columns.push({
                "id": "name",
                "type": "string",
                "catid": "Basics",
                "label": {
                    "en": "Name",
                    "de": "Name"
                },
                "options": {
                    "fixed": "left"
                }
            });
        } else {
            dataFilter.basics = _.uniq(dataFilter.basics); // remove duplicates
            dataFilter.basics.forEach(function (prop) {
                switch (prop) {
                case "code":
                    columns.push({
                        "id": "code",
                        "type": "string",
                        "catid": "Basics",
                        "label": {
                            "en": "ID",
                            "de": "ID"
                        },
                        "options": {
                            "fixed": "left"
                        }
                    });
                    break;
                case "name":
                    columns.push({
                        "id": "name",
                        "type": "string",
                        "catid": "Basics",
                        "label": {
                            "en": "Name",
                            "de": "Name"
                        },
                        "options": {
                            "fixed": "left"
                        }
                    });
                    break;
                case "description":
                    columns.push({
                        "id": "desc",
                        "type": "html",
                        "catid": "Basics",
                        "label": {
                            "en": "Description",
                            "de": "Beschreibung"
                        },
                    });
                    break;
                case "state":
                    columns.push({
                        "id": "state",
                        "type": "enum",
                        "catid": "Basics",
                        "label": {
                            "en": "State",
                            "de": "Zustand"
                        },
                        "format": {
                            "showIcon": true
                        }
                    });
                    break;
                case "portfolios":
                    columns.push({
                        "id": "portfolios",
                        "type": "multienum",
                        "catid": "Basics",
                        "label": {
                            "en": "Portfolios",
                            "de": "Portfolios"
                        },
                        "format": {
                            "showIcon": true
                        }
                    });
                    break;
                }
            });
        }

        if (dataFilter.costs) {
            dataFilter.costs = _.uniq(dataFilter.costs); // remove duplicates
            dataFilter.costs.forEach(function (cost) {
                switch (cost) {
                case "plan":
                    columns.push({
                        "id": "costs-plan",
                        "type": "money",
                        "catid": "Costs",
                        "label": {
                            "en": "Plan",
                            "de": "Plan"
                        },
                        "format": {
                            "digits": 2,
                            "currencyCode": "CHF"
                        },
                        "statistics": {
                            "sum": 0.0
                        }
                    });
                    break;
                case "budget":
                    columns.push({
                        "id": "costs-budget",
                        "type": "money",
                        "catid": "Costs",
                        "label": {
                            "en": "Budget",
                            "de": "Budget"
                        },
                        "format": {
                            "digits": 2,
                            "currencyCode": "CHF"
                        }
                    });
                    break;
                case "actual":
                    columns.push({
                        "id": "costs-actual",
                        "type": "money",
                        "catid": "Costs",
                        "label": {
                            "en": "Actual",
                            "de": "Ist"
                        },
                        "format": {
                            "digits": 2,
                            "currencyCode": "CHF"
                        }
                    });
                    break;
                case "forecast":
                    columns.push({
                        "id": "costs-forecast",
                        "type": "money",
                        "catid": "Costs",
                        "label": {
                            "en": "Forecast",
                            "de": "Prognose"
                        },
                        "format": {
                            "digits": 2,
                            "currencyCode": "CHF"
                        }
                    });
                    break;
                }
            });
        }

        let clsSchemas = null;
        if (dataFilter.classifications) {
            clsSchemas = Pqf.cls.getSchemasForType("Project");
            let curSchema = null;
            dataFilter.classifications.forEach(function (curCls) {
                curSchema = clsSchemas.find(x => x.id === curCls.id);
                curCls.cols.forEach(function (curClsCol) {
                    switch (curClsCol) {
                    case "class":
                        columns.push({
                            "id": curCls.id + "-class",
                            "type": "enum",
                            "catid": "Classification",
                            "label": {
                                "en": curSchema.name,
                                "de": curSchema.name
                            }
                        });
                        break;
                    case "score":
                        columns.push({
                            "id": curCls.id + "-score",
                            "type": "number",
                            "catid": "Classification",
                            "format": {
                                "digits": 2
                            },
                            "label": {
                                "en": curSchema.name + " (score)",
                                "de": curSchema.name + " (Punkte)"
                            }
                        });
                        break;
                    }
                });
            });
        }

        if (dataFilter.latestReports) {
            dataFilter.latestReports.forEach(function (latestReportConf) {
                latestReportConf.name = Pqf.pm.getProjectReportType(latestReportConf.reportType).name; // get name of this report type and save for later
                let catId = "Latest-" + latestReportConf.reportType;
                columns.push({
                    "id": latestReportConf.reportType + "-name",
                    "type": "string",
                    "catid": catId,
                    "label": {
                        "en": "Name",
                        "de": "Name"
                    }
                });
                columns.push({
                    "id": latestReportConf.reportType + "-period",
                    "type": "string",
                    "catid": catId,
                    "label": {
                        "en": "Periode",
                        "de": "Periode"
                    }
                });
                if (latestReportConf.dimensions) {
                    let dimObj = Pqf.pm.getIndicatorDimensionDefs(latestReportConf.reportType); // get name of this dimension type and save for later
                    latestReportConf.dimensions.forEach(function (dim) {
                        dim.name = dimObj.find(x => x.id === dim.id).name;
                        columns.push({
                            "id": latestReportConf.reportType + "-" + dim.id + "-status",
                            "type": "enum",
                            "catid": catId,
                            "format": {
                                "showIcon": true
                            },
                            "label": {
                                "en": "Status " + dim.name,
                                "de": "Status " + dim.name
                            }
                        });
                        columns.push({
                            "id": latestReportConf.reportType + "-" + dim.id + "-trend",
                            "type": "enum",
                            "catid": catId,
                            "format": {
                                "showIcon": true
                            },
                            "label": {
                                "en": "Trend " + dim.name,
                                "de": "Trend " + dim.name
                            }
                        });
                        columns.push({
                            "id": latestReportConf.reportType + "-" + dim.id + "-comment",
                            "type": "html",
                            "catid": catId,
                            "label": {
                                "en": "Comment " + dim.name,
                                "de": "Kommentar " + dim.name
                            }
                        });
                    });
                }
                if (latestReportConf.properties) {
                    latestReportConf.properties.forEach(function (prop) {
                        columns.push({
                            "id": prop.id,
                            "type": prop.type,
                            "catid": prop.catId ? prop.catId : "Properties",
                            "label": prop.label,
                            "format": prop.format
                        });
                    });
                }
            });
        }

        // ----------------------------
        // Prepare data rows
        // ----------------------------
        let dataRows = [];
        for (let i = 0; i < filteredProjects.length; i++) {
            let curProject = filteredProjects[i];
            let reportStates = null;
            dataFilter.latestReports.forEach(function (reportType) {
                if (reportType.relevantStates) {
                    reportStates = _.concat(reportStates, reportType.relevantStates.map(x => x.id));
                }
            });
            let curProjectSummary = Pqf.pm.getProjectSummary(curProject.id, (options.currency ? options.currency : null), reportStates, dataFilter.latestReports.map(x => x.reportType));
            let curRow = [];
            let curState = null;
            dataFilter.basics.forEach(function (prop) {
                switch (prop) {
                case "code":
                    curRow.push(curProject.code);
                    break;
                case "name":
                    curRow.push(curProject.name);
                    break;
                case "description":
                    const regex = /[^\x00-\x7F]/g;
                    curRow.push(_sanitizeString(curProject.description));
                    break;
                case "state":
                    curState = allStates.find(s => s.id === curProject.status);
                    curRow.push({
                        "id": curProject.status,
                        "name": curState.name,
                        "description": _sanitizeString(curState.description),
                        "iconRef": curState.iconRef,
                        "color": curState.color
                    });
                    break;
                case "portfolios":
                    curRow.push(curProject.portfolios.map(function (pf) {
                            return {
                                "id": pf.id,
                                "name": pf.name,
                                "description": _sanitizeString(pf.description)
                            };
                        }));
                    break;
                }
            });
            if (dataFilter.costs) {
                dataFilter.costs.forEach(function (cost) {
                    switch (cost) {
                    case "plan":
                        curRow.push(curProjectSummary.costsPlanned.amount);
                        break;
                    case "budget":
                        curRow.push(curProjectSummary.costsBudget.amount);
                        break;
                    case "actual":
                        curRow.push(curProjectSummary.costsActual.amount);
                        break;
                    case "forecast":
                        curRow.push(curProjectSummary.costsForecast.amount);
                        break;
                    }
                });
            }
            if (dataFilter.classifications) {
                dataFilter.classifications.forEach(function (curCls) {
                    let curPrjCls = curProject.classification.find(x => x.classificationSchemaId === curCls.id);
                    let curClsSchema = clsSchemas.find(x => x.id === curCls.id);
                    if (curPrjCls && curClsSchema) {
                        let curPrjClsClass = curClsSchema.classes.find(x => x.id === curPrjCls.classificationId);
                        if (curPrjClsClass) {
                            curCls.cols.forEach(function (curClsCol) {
                                switch (curClsCol) {
                                case "class":
                                    curRow.push(curPrjClsClass.name);
                                    break;
                                case "score":
                                    curRow.push(curPrjCls.score);
                                    break;
                                }
                            });
                        } else {
                            curCls.cols.forEach(function (curClsCol) {
                                switch (curClsCol) {
                                case "class":
                                    curRow.push(null);
                                    break;
                                case "score":
                                    curRow.push(null);
                                    break;
                                }
                            });
                        }
                    } else {
                        curCls.cols.forEach(function (curClsCol) {
                            switch (curClsCol) {
                            case "class":
                                curRow.push(null);
                                break;
                            case "score":
                                curRow.push(null);
                                break;
                            }
                        });
                    }
                });
            }
            if (dataFilter.latestReports) {
                dataFilter.latestReports.forEach(function (latestReportConf) {
                    let curReport = curProjectSummary.latestReports.find(x => x.type === latestReportConf.reportType);
                    if (curReport) {
                        curRow.push(curReport.name);
                        curRow.push(moment(curReport.validityStart).format("DD.MM.YYYY") + "-" + moment(curReport.validityEnd).subtract(1, "days").format("DD.MM.YYYY"));
                        if (latestReportConf.dimensions) {
                            latestReportConf.dimensions.forEach(function (dim) {
                                let curDim = curReport.indicators.dimensions.find(x => x.selection.dimension === dim.id);
                                if (curDim) {
                                    curRow.push(curDim.total.statusClass ? {
                                        "id": curDim.total.statusClass.id,
                                        "name": curDim.total.statusClass.name,
                                        "iconRef": curDim.total.statusClass.iconRef,
                                        "color": curDim.total.statusClass.color
                                    }
                                         : null);
                                    curRow.push(curDim.total.trendClass ? {
                                        "id": curDim.total.trendClass.id,
                                        "name": curDim.total.trendClass.name,
                                        "iconRef": curDim.total.trendClass.iconRef,
                                        "color": curDim.total.trendClass.color
                                    }
                                         : null);
                                    curRow.push(_sanitizeString(curDim.total.remark));
                                } else {
                                    curRow.push(null);
                                    curRow.push(null);
                                    curRow.push(null);
                                }
                            });
                        }
                        if (latestReportConf.properties) {
                            latestReportConf.properties.forEach(function (prop) {
                                let value = curReport.properties.find(x => x.key === prop.id).value;
                                curRow.push(prop.type == "number" ? parseFloat(value) : value);
                            });
                        }
                    } else {
                        curRow.push(null);
                        curRow.push(null);
                        if (latestReportConf.dimensions) {
                            latestReportConf.dimensions.forEach(function (dimId) {
                                curRow.push(null);
                                curRow.push(null);
                                curRow.push(null);
                            });
                        }
                        if (latestReportConf.properties) {
                            latestReportConf.properties.forEach(function (prop) {
                                curRow.push(null);
                            });
                        }
                    }
                });
            }
            dataRows.push(curRow);
        }

        // ----------------------------
        // Prepare statistics for each column and attach to column definitions
        // ----------------------------
        let dataCols = _.zip.apply(_, dataRows); // transpose matrix
        for (let i = 0; i < dataCols.length; i++) {
            let colData = dataCols[i].filter(x => !isNaN(parseFloat(x))); // Get only numbers
            if (["number", "money"].includes(columns[i].type)) {
                columns[i].statistics = {
                    "num": colData.length,
                    "sum": _.sum(colData),
                    "average": _.mean(colData),
                    "max": _.max(colData),
                    "min": _.min(colData)
                };
            }
        };

        // ------------------------
        // Assemble and return JSON report
        // ------------------------
        let categories = [{
                "id": "Basics",
                "label": {
                    "en": "Basics",
                    "de": "Grundangaben"
                }
            }, {
                "id": "Costs",
                "label": {
                    "en": "Costs",
                    "de": "Kosten"
                }
            }, {
                "id": "Classification",
                "label": {
                    "en": "Classification",
                    "de": "Einstufung"
                }
            }, {
                "id": "Properties",
                "label": {
                    "en": "Properties",
                    "de": "Eigenschaften"
                }
            },
        ];
        if (options.categories) {
            categories = categories.concat(options.categories);
        }
        dataFilter.latestReports.forEach(function (reportType) {
            if (reportType.relevantStates) {
                let stateNames = _.flatten(reportType.relevantStates.map(y => y.name)).join(", ");
                categories.push({
                    "id": "Latest-" + reportType.reportType,
                    "label": {
                        "en": "Latest " + reportType.name + " (" + stateNames + ")",
                        "de": "Aktuellster " + reportType.name + " (" + stateNames + ")"
                    }
                });
            }
        });

        let now = moment();
        let report = {
            "id": "",
            "code": "PF-SS",
            "name": {
                "en": "Portfolio snapshot as of " + now.format("DD.MM.YYYY") + " (" + dataRows.length + " projects)",
                "de": "Portfolio-Snapshot vom " + now.format("DD.MM.YYYY") + " (" + dataRows.length + " Projekte)"
            },
            "desc": {
                "en": "Various project figures from a set of projects",
                "de": "Diverse Projekt-Kennzahlen aus einer Menge von Projekten"
            },
            "createdAt": moment().toISOString(),
            "createdBy": _getCurrentUserName(),
            "meta": {
                "categories": categories,
                "columns": columns
            },
            "data": dataRows
        };
        return report;
    }

    function _checkRawTextEqual(text1, text2) {
        // Strips HTML and makes them empty strings if necessary before comparing the two texts.
        let rawText1 = _stripHtml(text1);
        let rawText2 = _stripHtml(text2);
        if (rawText1 === null) {
            rawText1 = "";
        }
        if (rawText2 === null) {
            rawText2 = "";
        }
        return rawText1 === rawText2;
    }

    function _getPropertyValueOrNull(object, propertyId) {
        let propValue = null;
        if (object && object.properties && Array.isArray(object.properties)) {
            let prop = object.properties.find(x => x.key === propertyId);
            if (prop) {
                propValue = prop.value;
            }
        }
        return propValue;
    }

    function _checkPropertyChanged(objectWithProps, propKey, compareValue, stripHtml) {
        stripHtml = (typeof stripHtml !== "undefined" ? stripHtml : false); // optional argument, default: stripHtml = false
        let hasChanged = false;
        let prop = objectWithProps.properties.find(x => x.key === propKey);
        if (prop) {
            if (stripHtml) {
                // We strip HTML before we compate in order to avoid cases where old and new value are considered different.
                if (!_checkRawTextEqual(prop.value, compareValue)) {
                    prop.value = compareValue;
                    hasChanged = true;
                }
            } else {
                if (prop.value != compareValue) { // We deliberately use != instead of !== so that oldValue and compareValue are type-converted (like this we compare strings and numbers, e.g., "10.5" == 10.5)
                    prop.value = compareValue;
                    hasChanged = true;
                }
            }
        }
        return hasChanged;
    }

    function _execOnce(myFunc) {
        // "stopExecution" is a boolean that stores a status
        let stop = store.load("stopExecution");
        if (stop) {
            store.save("stopExecution", false);
            console.log("Stopping.");
        } else {
            store.save("stopExecution", true);
            console.log("Starting...");
            myFunc();
        }
    }

    function _execOncePerObject(objectId, myFunc) {
        // "stopExecution" is an object that stores a status per object ID
        let stop = store.load("stopExecution");
        if (stop && stop[objectId]) {
            stop[objectId] = false;
            store.save("stopExecution", stop);
            console.log("Stopping.");
        } else {
            if (!stop) {
                stop = {};
            }
            stop[objectId] = true;
            store.save("stopExecution", stop);
            console.log("Starting...");
            myFunc();
        }
    }

    function _cleanHtmlProperty(value) {
        // Removes artefacts caused be the Summernote HTML text editor
        switch (value) {
        case "<!-- pqf-html-v2 -->":
        case "<!-- pqf-html-v2 --><br>":
            return "";
        default:
            return value;
        }
    }

    function _createReportNotification(host, recipient, report, reportType, project, relation, reason, callForAction) {
        // deprecated, use _createReportNotification2 instead
        host = host + _getTenantAlias();
        return _createReportNotification2(host, recipient, report, reportType, project, relation, reason, callForAction);
    }

    function _createReportNotification2(host, recipient, report, reportType, project, relation, reason, callForAction) {
        // Creates an elaborate HTML email body as a report notification which gives reasons for receiving the mail and a call for action.
        // Arguments:
        // - host (string, required) = URL of the PQFORCE host including alias
        // - recipient (object, required) = object with recipient.userName (required) and recipient.resourceName (optional) which the notification is sent to
        // - report (object, required) = report object with report.id and report.name
        // - reportType (object, required) = report type object with reportType.id and reportType.name
        // - project (object, required) = project object with project.id, project.name and project.portfolios (array) which the report belongs to
        // - relation (object, optional) = object with relation.toProject (string, optional) and relation.toReport (string, optional) that shows the relation the user has to the project (if any) and/or to the report, which might come from a report property where the user (resource) is referred to, e.g., as responsible person
        // - reportRelation (string, optional) = text that shows the relation the user has to the report (if any)
        // - reason (string, optional) = HTML text that gives the reason why the report needs attention
        // - callForAction (string, optional) = HTML text that gives the action the user should take

        let linkToReport = host
             + "?type=Project&id=" + project.id
             + "&seltype=" + reportType.id
             + "&selid=" + report.id
             + "&partype=ProjectPortfolio&parid=" + project.portfolios[0].id
             + "&feature=projectreport";

        // First reason for receiving the notification: User has a relation to the project and/or the report in question
        let mailBody = "<p><b>Weshalb erhalten Sie diese E-Mail?</b></p>";
        mailBody += "<p>";
        mailBody += "Sie sind als Benutzer <i>" + recipient.userName + "</i> in PQFORCE registriert";
        if (relation !== null && typeof relation.toProject !== "undefined" && relation.toProject !== null) {
            mailBody += " und stehen";
            if (recipient.resourceName !== null) {
                mailBody += " mit der Ressource <i>" + recipient.resourceName + "</i>";
            }
            mailBody += " in der Beziehung <i>" + relation.toProject + "</i> zu Projekt <i>" + project.name + "</i>";
        }
        if (relation !== null && typeof relation.toReport !== "undefined" && relation.toReport !== null) {
            mailBody += " und stehen";
            if (recipient.resourceName !== null) {
                mailBody += " mit der Ressource <i>" + recipient.resourceName + "</i>";
            }
            mailBody += " auf dem Rapport <i>" + report.name + "</i> als <i>" + relation.toReport + "</i> eingetragen";
        }
        mailBody += ".</p>";

        // Further reason for receiving the notification: The report needs some attention
        mailBody += "<p>" + reason + "</p>";

        mailBody += "<p><b>Was ist zu tun?</b></p>";
        mailBody += "<p>" + _replaceAll(callForAction, "[[linkToReport]]", linkToReport) + "</p>";

        return mailBody;
    }

    function _createReportTableHtml(report, skin) {
        let darkColor = _DEFAULT_MAIL_PARAMS.skin.darkBackgroundColor;
        let lightColor = _DEFAULT_MAIL_PARAMS.skin.lightBackgroundColor;
        if (skin) {
            if (skin.darkColor) {
                darkColor = skin.darkBackgroundColor;
            }
            if (skin.lightColor) {
                lightColor = skin.lightBackgroundColor;
            }
        }

        let tableStyling = "border: 1px solid black; border-collapse: collapse; font-size: 12px;";
        let headerCellStyling = "border: 1px solid black; border-collapse: collapse; padding: 5px; background-color: " + darkColor + "; color: white;";
        let dataCellStyling = "border: 1px solid black; border-collapse: collapse; padding: 5px; background: white;";
        let dataCellStylingHighlight = "border: 1px solid black; border-collapse: collapse; padding: 5px; background: " + lightColor + ";";

        let tableHtml = "<table style=\"" + tableStyling + "\">[[reportHeader]][[reportBody]]</table>";

        // Report header
        let reportHeader = "<th style=\"" + headerCellStyling + "\">#</th>";
        report.headers.forEach(function (header) {
            reportHeader += "<th style=\"" + headerCellStyling + "\">" + header + "</th>";
        });
        tableHtml = tableHtml.replace("[[reportHeader]]", "<thead><tr>" + reportHeader + "</tr></thead>");

        // Report body
        let reportBody = "";
        let rowCounter = 1;
        report.data.forEach(function (dataRow) {
            let row = "<td style=\"" + dataCellStyling + "\">" + rowCounter + "</td>";
            dataRow.forEach(value => {
                let highlight = false;
                let url = null;
                if (typeof value === "object" && value !== null) {
                    highlight = (typeof value.highlight == "boolean" ? value.highlight : false);
                    url = (typeof value.url == "string" ? value.url : null);
                    value = value.value;
                    if (url) {
                        value = "<a href=\"" + url + "\">" + value + "</a>";
                    }
                }
                if (typeof value === "undefined" || value === null) {
                    value = "n/a";
                }
                row += "<td style=\"" + (highlight ? dataCellStylingHighlight : dataCellStyling) + "\">" + value + "</td>";
            });
            reportBody += "<tr>" + row + "</tr>";
            rowCounter++;
        });
        tableHtml = tableHtml.replace("[[reportBody]]", "<tbody>" + reportBody + "</tbody>");

        return tableHtml;
    }

    /**
     * Sends an HTML email based on a skin.
     * @param {string[]} receivers - Email addresses of the receivers
     * @param {string} subject - Subject of the mail
     * @param {string} body - Body of the mail (HTML)
     * @param {object} [skin=null] - JSON with skin parameters (see default skin _DEFAULT_MAIL_PARAMS in this library for structure)
     * @param {boolean} [wait=true] - Wait for request to finish
     */
    function _sendHtmlMail(receivers, subject, body, skin, wait) {
        skin = typeof skin !== "undefined" ? skin : null;
        wait = typeof wait !== "undefined" ? wait : true;
        let mailBody = _prepareMailTemplate("notification", skin);
        mailBody = _replaceAll(mailBody, "[[Title]]", "");
        mailBody = _replaceAll(mailBody, "[[Intro]]", "");
        mailBody = _replaceAll(mailBody, "[[Message]]", body);
        mailBody = _replaceAll(mailBody, "[[Outro]]", "");
        Pqf.msg.sendMail(receivers, null, null, subject, mailBody, true, wait);
    }

    /**
     * Sends a simply formatted HTML with intro and outro.
     * @param {string[]} receivers - Email addresses of the receivers
     * @param {string} title - Used as title of the mail body part and also as part of the mail subject
     * @param {string} [intro=""] - Intro of the mail body (HTML, will be wrapped in <p>)
     * @param {string} [message=""] - Main part of the mail body (HTML, will be wrapped in <p>)
     * @param {string} [outro=""] - Outro of the mail body (HTML, will be wrapped in <p>)
     * @param {boolean} [wait=true] - Wait for request to finish
     */
    function _sendSimpleNotificationMail(receivers, title, intro, message, outro, wait) {
        intro = typeof intro !== "undefined" ? intro : "";
        message = typeof message !== "undefined" ? message : "";
        outro = typeof outro !== "undefined" ? outro : "";
        wait = typeof wait !== "undefined" ? wait : true;

        let mailSubject = "PQFORCE Notification: " + title;

        let mailBody = _prepareMailTemplate("simple");
        mailBody = _replaceAll(mailBody, "[[Title]]", (title ? title : ""));
        mailBody = _replaceAll(mailBody, "[[Intro]]", (intro ? intro : ""));
        mailBody = _replaceAll(mailBody, "[[Message]]", (message ? message : ""));
        mailBody = _replaceAll(mailBody, "[[Outro]]", (outro ? outro : ""));

        Pqf.msg.sendMail(receivers, null, null, mailSubject, mailBody, true, wait);
    }

    function _sendNotificationMail3(receivers, title, intro, message, outro, withStylingWrapper, skin, wait) {
        // Sends an HTML email with a notification message at its core. The function creates a nice intro and outro.
        // Arguments:
        // - receivers = array of email addresses
        // - title = becomes part of mail subject
        // - intro (optional) = first line of the message (string), e.g. something like "Hello [name of receiver]!", default = ""
        // - message (optional) = HTML-formatted message, becomes part of the email body, default = ""
        // - outro (optional) = last line of the message (string), used in outro, default = ""
        // - withStylingWrapper (optional) = Wrap body in wrapper with logo and font styling? (boolean), default = false
        // - skin (optional) = JSON with skin parameters (see default skin in this library for structure), default = null (default skin applied)
        // - wait (optional) = Wait for request to finish (default = true)

        intro = typeof intro !== "undefined" ? intro : "";
        message = typeof message !== "undefined" ? message : "";
        outro = typeof outro !== "undefined" ? outro : "";
        withStylingWrapper = typeof withStylingWrapper !== "undefined" ? withStylingWrapper : false;
        skin = typeof skin !== "undefined" ? skin : null;
        wait = typeof wait !== "undefined" ? wait : true;

        let mailSubject = "PQFORCE Notification: " + title;
        let mailStyling = "font-family: 'Work Sans', 'Helvetica Neue', Arial; font-size: 15px;";

        let mailBody = _prepareMailTemplate("notification", skin);
        if (withStylingWrapper) {
            mailBody = "<div style=\"" + mailStyling + "\">";
            mailBody += "<p><a href=\"https://www.pqforce.com/\" target=\"_blank\"><img src=\"https://pqforce.com/logo-colour-a.png\" style=\"border:0;display:block;outline:none;text-decoration:none;height:auto;font-size:13px;\"></a></p>";
        }
        mailBody = _replaceAll(mailBody, "[[Title]]", (title ? title : ""));
        mailBody = _replaceAll(mailBody, "[[Intro]]", (intro ? intro : ""));
        mailBody = _replaceAll(mailBody, "[[Message]]", (message ? message : ""));
        mailBody = _replaceAll(mailBody, "[[Outro]]", (outro ? outro : ""));
        if (withStylingWrapper) {
            mailBody += "</div>";
        }

        Pqf.msg.sendMail(receivers, null, null, mailSubject, mailBody, true, wait);
    }

    function _sendNotificationMail2(receivers, title, intro, message, outro, withStylingWrapper) {
        // deprecated
        _sendNotificationMail3(receivers, title, intro, message, outro, withStylingWrapper);
    }

    function _sendNotificationMail(receivers, title, intro, message, outro) {
        // deprecated
        _sendNotificationMail2(receivers, title, intro, message, outro);
    }

    function _validateEmail(email) {
        return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    }

    function _sendLifecycleDecisionNotificationMail(receivers, title, objectName, objectUrl, stateBefore, stateNow, objectType, commentLabel, comment, intro, outro, wait) {
        objectType = typeof objectType !== "undefined" ? objectType : "Project";
        commentLabel = typeof commentLabel !== "undefined" ? commentLabel : "Kommentar";
        comment = typeof comment !== "undefined" ? comment : "";
        intro = typeof intro !== "undefined" ? intro : "";
        outro = typeof outro !== "undefined" ? outro : "";
        wait = typeof wait !== "undefined" ? wait : true;

        let mailSubject = "PQFORCE: " + title;

        let mailBody = "";
        switch (objectType) {
        case "Project":
            mailBody = _prepareMailTemplate("lifecycleDecisionProject");
            break;
        case "ChangeRequest":
            mailBody = _prepareMailTemplate("lifecycleDecisionChangeRequest");
            break;
        default:
            throw new Error("Undefined objectType " + ObjectType + " in function _sendLifecycleCommentNotificationMail");
        }
        mailBody = _replaceAll(mailBody, "[[Title]]", title);
        mailBody = _replaceAll(mailBody, "[[Intro]]", intro);
        mailBody = _replaceAll(mailBody, "[[Outro]]", outro);
        mailBody = _replaceAll(mailBody, "[[ObjectName]]", objectName);
        mailBody = _replaceAll(mailBody, "[[ObjectUrl]]", objectUrl);
        mailBody = _replaceAll(mailBody, "[[StateNameBefore]]", stateBefore);
        mailBody = _replaceAll(mailBody, "[[StateNameNow]]", stateNow);
        mailBody = _replaceAll(mailBody, "[[CommentLabel]]", commentLabel);
        mailBody = _replaceAll(mailBody, "[[Comment]]", comment);

        Pqf.msg.sendMail(receivers, null, null, mailSubject, mailBody, true, wait);
    }

    function _sendLifecycleCommentNotificationMail(receivers, title, objectName, objectUrl, state, objectType, commentLabel, comment, intro, outro, wait) {
        objectType = typeof objectType !== "undefined" ? objectType : "Project";
        commentLabel = typeof commentLabel !== "undefined" ? commentLabel : "Kommentar";
        comment = typeof comment !== "undefined" ? comment : "";
        intro = typeof intro !== "undefined" ? intro : "";
        outro = typeof outro !== "undefined" ? outro : "";
        wait = typeof wait !== "undefined" ? wait : true;

        let mailSubject = "PQFORCE: " + title;

        let mailBody = "";
        switch (objectType) {
        case "Project":
            mailBody = _prepareMailTemplate("lifecycleCommentProject");
            break;
        case "ChangeRequest":
            mailBody = _prepareMailTemplate("lifecycleCommentChangeRequest");
            break;
        default:
            throw new Error("Undefined objectType " + ObjectType + " in function _sendLifecycleCommentNotificationMail");
        }
        mailBody = _replaceAll(mailBody, "[[Title]]", title);
        mailBody = _replaceAll(mailBody, "[[Intro]]", intro);
        mailBody = _replaceAll(mailBody, "[[Outro]]", outro);
        mailBody = _replaceAll(mailBody, "[[ObjectName]]", objectName);
        mailBody = _replaceAll(mailBody, "[[ObjectUrl]]", objectUrl);
        mailBody = _replaceAll(mailBody, "[[StateName]]", state);
        mailBody = _replaceAll(mailBody, "[[CommentLabel]]", commentLabel);
        mailBody = _replaceAll(mailBody, "[[Comment]]", comment);

        Pqf.msg.sendMail(receivers, null, null, mailSubject, mailBody, true, wait);
    }

    function _sendReportMail(receivers, title, reports, skin, wait) {
        // Sends an HTML email with report tables
        // Arguments:
        // - receivers = array of email addresses
        // - title = becomes part of mail subject
        // - reports = array of report objects of type {"title": string, "summary": string (HTML), "type": "Maintenance"|"Report", "headers": [array of header strings], "data": [array of arrays], "outro": string (HTML) }
        //             each array in "data" consists of values, where a value is either atomic or an object of type {"value": value, "highlight": true/false, "url": string|null}
        // - skin (optional) = {"logoSrc": string, URL of a small image, "link": string, URL behind the logo, "darkColor": #rrggbb, "lightColor": #rrggbb}
        // - wait (optional) = Wait for request to finish (default = true)

        let mailSubject = "PQFORCE: " + title;
        let mailStyling = "font-family: 'Work Sans', 'Helvetica Neue', Arial; font-size: 12px; color: black;";
        let reportExecutionStyling = "font-size: 12px;";
        let darkColor = _DEFAULT_MAIL_PARAMS.skin.darkColor;
        let lightColor = _DEFAULT_MAIL_PARAMS.skin.lightColor;
        let logoLink = _DEFAULT_MAIL_PARAMS.skin.logoLink;
        let logoSrc = _DEFAULT_MAIL_PARAMS.skin.logoSrc;
        wait = typeof wait !== "undefined" ? wait : true;
        if (skin) {
            if (skin.darkColor) {
                darkColor = skin.darkColor;
            }
            if (skin.lightColor) {
                lightColor = skin.lightColor;
            }
            if (skin.logoSrc) {
                logoSrc = skin.logoSrc;
            }
            if (skin.link) {
                logoLink = skin.logoLink;
            }
        }

        let reportTitleStylingMaintenance = "background-color: " + lightColor + "; margin-top: 50px;";
        let reportTitleStylingReport = "background-color: " + lightColor + "; margin-top: 50px;";
        let reportSummaryStyling = "font-size: 12px;";
        let reportOutroStyling = "font-size: 12px;";

        let reportsHtml = "";
        reports.forEach(function (report) {
            let tableHtml = _createReportTableHtml(report, skin);
            switch (report.type) {
            case "Maintenance":
                reportsHtml += "<p style=\"" + reportTitleStylingMaintenance + "\">" + report.type + ": <b>" + report.title + "</b></p>";
                break;
            default:
                reportsHtml += "<p style=\"" + reportTitleStylingReport + "\">" + report.type + ": <b>" + report.title + "</b></p>";
            }
            if (typeof report.summary !== "undefined" && report.summary !== null) {
                reportsHtml += "<p style=\"" + reportSummaryStyling + "\">" + report.summary + "</p>";
            }
            reportsHtml += "<p>" + tableHtml + "</p>";
            if (typeof report.outro !== "undefined" && report.outro !== null) {
                reportsHtml += "<p style=\"" + reportOutroStyling + "\">" + report.outro + "</b></p>";
            }
        });

        let mailBody = "<div style=\"" + mailStyling + "\">";
        mailBody += "<p><a href=\"" + logoLink + "\" target=\"_blank\"><img src=\"" + logoSrc + "\" style=\"border:0;display:block;outline:none;text-decoration:none;height:auto;font-size:13px;\"></a></p>";
        mailBody += "<p style=\"" + reportExecutionStyling + "\">Zeitpunkt der Ausführung der folgenden Rapporte: <b>" + moment().format("DD. MMM YYYY, H:mm:ss") + "</b> (Stichdatum)</p>";
        mailBody += reportsHtml;
        mailBody += "<p style=\"text-align: right; font-size: 10px;\">Report powered by <a href=\"https://www.pqforce.com\" target=\"_blank\"><img src=\"https://www.pqforce.com/logo-colour-a.png\" height=\"20\" style=\"border:0;display:block;outline:none;text-decoration:none;height:auto;font-size:13px;\"></a></p>";
        mailBody += "</div>";

        Pqf.msg.sendMail(receivers, null, null, mailSubject, mailBody, true, wait);
    }

    function _maintenanceZeroEffortBooking(bookingDate, resourceTypeIds, bookingProject, zeroEffortComment) {
        const PSEUDO_EFFORT = {
            "day": bookingDate.format("YYYY-MM-DD"),
            "projectId": bookingProject.id,
            "workItemId": null,
            "duration": "PT0H0M",
            "comment": zeroEffortComment
        };

        let dataRows = [];
        let summary = "<b>Zusammenfassung:</b>";
        resourceTypeIds.forEach(function (resourceTypeId) {
            console.log("Processing resources of type ID " + resourceTypeId);
            let allResources = Pqf.res.getResourcesByType(resourceTypeId);

            allResources.forEach(function (resource) {
                Pqf.act.putResourceProjectTime(resource.id, bookingDate.format("YYYY-MM-DD"), bookingProject.id, PSEUDO_EFFORT);
                dataRows.push({
                    "resourceName": resource.name,
                    "resourceTypeId": resourceTypeId
                });
            });
            summary += "<br><b>" + allResources.length + "</b> Ressourcen mit Typ-ID <b>" + resourceTypeId + "</b> gefunden (siehe Tabelle unten) und Nuller-Buchung geschrieben";
        });
        summary += "<br>Alle Nuller-Buchungen geschrieben per <b>" + bookingDate.format("DD.MM.YYYY") + "</b> auf Projekt <b>" + bookingProject.name + "</b> (ID: " + bookingProject.id + ")";

        let report = {
            "type": "Maintenance",
            "title": "Geschriebene Nuller-Buchungen",
            "headers": ["Name der Ressource", "Ressourcen-Typ ID"],
            "data": dataRows,
            "summary": summary
        };

        return report;
    }

    function _resourceStatistics(resourceTypeIds, format) {
        format = typeof format !== "undefined" ? format : "simple";

        let dataRows = [];
        resourceTypeIds.forEach(function (resourceTypeId) {
            console.log("Processing resources of type ID " + resourceTypeId);
            let allResources = Pqf.res.getResourcesByType(resourceTypeId);
            dataRows.push([
                    resourceTypeId,
                    allResources.length
                ]);
        });

        let report = null;
        switch (format) {
        case "pqfJSON":
            report = {
                "id": "",
                "code": "ResStat",
                "name": {
                    "en": "Resource statistics",
                    "de": "Ressourcenstatistik"
                },
                "description": {
                    "en": "Number of existing resources by type",
                    "de": "Anzahl existierender Ressourcen pro Typ"
                },
                "meta": {
                    "columns": [{
                            "id": "type",
                            "type": "string",
                            "label": {
                                "en": "Type",
                                "de": "Typ"
                            }
                        }, {
                            "id": "quantity",
                            "type": "number",
                            "label": {
                                "en": "Quantity",
                                "de": "Anzahl"
                            },
                            "format": {
                                "digits": 0,
                                "unit": {
                                    "en": "res",
                                    "de": "Res."
                                }
                            },
                            "options": {
                                "aggrgation": "sum"
                            }
                        }
                    ]
                },
                "data": dataRows
            };
            break;
        default:
            report = {
                "type": "Report",
                "title": "Anzahl Ressourcen pro Typ",
                "headers": ["Ressourcen-Typ ID", "#Ressourcen"],
                "data": dataRows
            };
        }

        return report;
    }

    function _resourceEffortsInPeriod(startDate, endDate, reportingDelayInDays, projectProperties, format, resourceProperties) {
        // Creates a report
        // Arguments:
        // - startDate = string of form "YYYY-MM-DD" (beginning of period)
        // - endDate = string of form "YYYY-MM-DD" (end of period)
        // - reportingDelayInDays = integer (rows are highlighted if last reporting date of resource lags behind by this many days)
        // - projectProperties = array of
        //    - propertyId = string (ID of the project property)
        //    - propertyType = string (type of the project property, needs to be a JTF compatible type)
        //    - subobjType = string (ID of subobject type that contains the property; if null, then a project property is assumed)
        //    - colName = string (Header of the data column in the generated report)
        //    - colPos = integer (position at which the column is to be placed)
        // - format = string, "simple" (default) or "pqfJSON"
        // - resourceProperties = array of
        //    - propertyId = string (ID of the resource property)
        //    - propertyType = string (type of the project property, needs to be a JTF compatible type)
        //    - colName = string (Header of the data column in the generated report)
        //    - colPos = integer (position at which the column is to be placed)

        format = typeof format !== "undefined" ? format : "simple";

        let dataRows = [];
        let allResources = Pqf.res.getResourceHierarchyByType("HRM-RES-TYP-EMP");

        allResources.forEach(function (resource) {
            let resourceId = resource.ancestors.find(x => x.type === "HRM-RES-TYP-OU").id;
            let ancestor = null;
            try {
                ancestor = Pqf.res.getResource(resourceId);
            } catch (err) {
                _log(1, "warn", "CA6EE75972E24877A6406AB40A8767F3", "Cannot get resource with resource ID " + resourceId);
            }
            resource = Pqf.res.getResource(resource.id);

            let resourcePropColumns = [];
            resourceProperties?.forEach(function (prop) {
                let propValue = resource.properties.find(x => x.key === prop.propertyId)?.value || "n/a";
                resourcePropColumns.push({
                    "value": propValue,
                    "pos": prop.colPos
                });
            });

            let allocs = Pqf.alc.getProjectAndPhaseAllocationsByResource(resource.id, startDate, endDate);
            allocs.projects.forEach(function (project) {
                project = Pqf.pm.getProject(project.id);
                let projectPropColumns = [];
                projectProperties?.forEach(function (prop) {
                    let propValue = null;
                    if (prop.subobjType) {
                        let subobj = Pqf.pm.getProjectSubObj(project.id, prop.subobjType);
                        if (subobj && prop.propertyId) {
                            propValue = subobj.properties.find(x => x.key === prop.propertyId)?.value || "n/a";
                        }
                    } else if (prop.propertyId) {
                        propValue = project.properties.find(x => x.key === prop.propertyId)?.value || "n/a";
                    }
                    projectPropColumns.push({
                        "value": propValue,
                        "pos": prop.colPos
                    });
                });
                let slotWholePeriod = Pqf.alc.getMacroAllocationSlot(resource.id, startDate, moment(endDate).add(1, "days").format("YYYY-MM-DD"), project.id);
                let allocDuration = 0.0;
                let actualDuration = 0.0;
                if (slotWholePeriod && slotWholePeriod.slots && slotWholePeriod.slots[0] && slotWholePeriod.slots[0].forecasts && slotWholePeriod.slots[0].forecasts[0]) {
                    allocDuration = _round(moment.duration(slotWholePeriod.slots[0].forecasts[0].planned).asHours(), 2);
                    actualDuration = _round(moment.duration(slotWholePeriod.slots[0].forecasts[0].actual).asHours(), 2);
                }
                let latestReportingDate = slotWholePeriod.actualsReportedUntil;
                let slotUntilToday = Pqf.alc.getMacroAllocationSlot(resource.id, startDate, moment().add(-1, "days").format("YYYY-MM-DD"), project.id);
                let targetDuration = 0.0;
                if (slotUntilToday && slotUntilToday.slots && slotUntilToday.slots[0] && slotUntilToday.slots[0].forecasts && slotUntilToday.slots[0].forecasts[0]) {
                    targetDuration = _round(moment.duration(slotUntilToday.slots[0].forecasts[0].planned).asHours(), 2);
                }
                if (slotWholePeriod && (allocDuration > 0.0 || actualDuration > 0.0 || targetDuration > 0.0)) {
                    let deviation = (targetDuration == 0.0 ? (actualDuration == 0.0 ? 0.0 : 100.0) : _round(100.0 * (actualDuration - targetDuration) / targetDuration, 2));
                    let devAbs = Math.abs(deviation);
                    let styleDeviation = (devAbs > 50.0 ? "critical" : (devAbs > 30.0 ? "problem" : (devAbs > 10.0 ? "warning" : "ok")));
                    let styleLatestReportingDate = moment().diff(moment(latestReportingDate), "days") > reportingDelayInDays ? "warning" : null;
                    let dataRow = {
                        "style": {
                            "row": styleLatestReportingDate ? {
                                "fontWeight": "bold"
                            }
                             : null,
                            "cells": {
                                "targetDeviation": styleDeviation,
                                "latestReportingDate": styleLatestReportingDate
                            },
                        },
                        "id": resource.id + "|" + project.id,
                        "data": [
                            resource.name,
                            ancestor.name,
                            project.name,
                            allocDuration,
                            actualDuration,
                            targetDuration,
                            deviation,
                            latestReportingDate,
                            startDate,
                            endDate
                        ]
                    };
                    projectPropColumns.forEach(function (item) {
                        dataRow.data.splice(item.pos, 0, item.value);
                    });
                    resourcePropColumns.forEach(function (item) {
                        dataRow.data.splice(item.pos, 0, item.value);
                    });
                    dataRows.push(dataRow);
                }
            });
        });

        let report = null;
        switch (format) {
        case "pqfJSON":
            let jsonColumns = [{
                    "id": "emp",
                    "type": "string",
                    "label": {
                        "en": "Employee",
                        "de": "Mitarbeitende/r"
                    }
                }, {
                    "id": "orgUnit",
                    "type": "string",
                    "label": {
                        "en": "Org Unit",
                        "de": "Org.einheit"
                    }
                }, {
                    "id": "projectName",
                    "type": "string",
                    "label": {
                        "en": "Project name",
                        "de": "Projektname"
                    }
                }, {
                    "id": "targetInPeriod",
                    "type": "number",
                    "label": {
                        "en": "Target in Period",
                        "de": "Soll Periode"
                    },
                    "format": {
                        "digits": 1,
                        "unit": {
                            "en": "h",
                            "de": "h"
                        }
                    },
                    "options": {
                        "aggregation": "sum"
                    }
                }, {
                    "id": "actuals",
                    "type": "number",
                    "label": {
                        "en": "Actuals",
                        "de": "Ist"
                    },
                    "format": {
                        "digits": 1,
                        "unit": {
                            "en": "h",
                            "de": "h"
                        }
                    },
                    "options": {
                        "aggregation": "sum"
                    }
                }, {
                    "id": "targetToDate",
                    "type": "number",
                    "label": {
                        "en": "Target to date",
                        "de": "Soll bis Stichdatum"
                    },
                    "format": {
                        "digits": 1,
                        "unit": {
                            "en": "h",
                            "de": "h"
                        }
                    },
                    "options": {
                        "aggregation": "sum"
                    }
                }, {
                    "id": "targetDeviation",
                    "type": "number",
                    "label": {
                        "en": "Deviation",
                        "de": "Abweichung"
                    },
                    "format": {
                        "digits": 1,
                        "unit": {
                            "en": "%",
                            "de": "%"
                        }
                    },
                    "options": {
                        "aggregation": "none"
                    }
                }, {
                    "id": "latestReportingDate",
                    "type": "date",
                    "label": {
                        "en": "Latest reporting",
                        "de": "Letzte Rapportierung"
                    },
                    "format": {
                        "format": "DD.MM.YYYY"
                    }
                }, {
                    "id": "targetPeriodFromDate",
                    "type": "date",
                    "label": {
                        "en": "Target period from",
                        "de": "Soll-Periode von"
                    },
                    "format": {
                        "format": "DD.MM.YYYY"
                    }
                }, {
                    "id": "targetPeriodToDate",
                    "type": "date",
                    "label": {
                        "en": "Target period to",
                        "de": "Soll-Periode bis"
                    },
                    "format": {
                        "format": "DD.MM.YYYY"
                    }
                }
            ];

            projectProperties?.forEach(function (prop) {
                let langLabel = {};
                _LANGUAGES_AVAILABLE.forEach(function (lang) {
                    langLabel[lang] = (typeof prop.colName == "string" ? prop.colName : prop.colName[lang]);
                });
                jsonColumns.splice(prop.colPos, 0, {
                    "id": prop.propertyId,
                    "type": prop.propertyType,
                    "label": langLabel
                });
            });

            resourceProperties?.forEach(function (prop) {
                let langLabel = {};
                _LANGUAGES_AVAILABLE.forEach(function (lang) {
                    langLabel[lang] = (typeof prop.colName == "string" ? prop.colName : prop.colName[lang]);
                });
                jsonColumns.splice(prop.colPos, 0, {
                    "id": prop.propertyId,
                    "type": prop.propertyType,
                    "label": langLabel
                });
            });

            report = {
                "id": "",
                "code": "ResEffort",
                "name": {
                    "en": "Resource efforts",
                    "de": "Ressourcenleistungen"
                },
                "description": {
                    "en": "Reported efforts in time period",
                    "de": "Rapportierte Leistungen in Zeitperiode"
                },
                "meta": {
                    "columns": jsonColumns,
                    "styles": {
                        "ok": {
                            "backgroundColor": "#dff6ae",
                            "color": "#3fb03f"
                        },
                        "warning": {
                            "backgroundColor": "#ffff7a",
                            "color": "#e36a3c",
                            "fontWeight": "bold"
                        },
                        "problem": {
                            "backgroundColor": "#fac35d",
                            "color": "#c63700",
                            "fontWeight": "bold"
                        },
                        "critical": {
                            "backgroundColor": "LightCoral",
                            "color": "DarkRed",
                            "fontWeight": "bold"
                        }
                    }
                },
                "data": dataRows
            };
            break;
        default:
            let headers = ["MA", "OrgEinheit", "Projektname", "Soll Periode [h]", "Ist [h]", "Soll bis Stichdatum [h]", "Letzte Rapportierung"];
            projectProperties.forEach(function (prop) {
                headers.splice(prop.colPos, 0, prop.colName);
            });
            report = {
                "type": "Report",
                "title": "MA-Leistungen für die Periode vom " + _getDate(startDate, "DD.MM.YYYY") + " bis " + _getDate(endDate, "DD.MM.YYYY"),
                "summary": "Hiernach werden Leistungen <b>pro Mitarbeiter und Projekt</b> zwischen <b>" + _getDate(startDate, "dddd, DD.MM.YYYY") + "</b> und <b>" + _getDate(endDate, "dddd, DD.MM.YYYY") + "</b> aufgeführt.",
                "outro": "Legende:" +
                "<ul>" +
                "<li><b>Soll Periode</b> = In der Periode total zu leistender Aufwand (Plan)</li>" +
                "<li><b>Ist</b> = Seit Start der Periode geleisteter Aufwand (rapportiert)</li>" +
                "<li><b>Soll bis Stichdatum</b> = Zwischen Start der Periode und Stichdatum zu leistender Aufwand (Soll)</li>" +
                "<li><b>Letzte Rapportierung</b> = Datum der letzten Leistungsrapportierung des/der MA (eingefärbt, wenn länger als " + reportingDelayInDays + " Tage zurückliegend)</li>" +
                "<li><b>Stichdatum</b> = Zeitpunkt der Generierung des Rapports (siehe oben)</li>" +
                "</ul>",
                "headers": headers,
                "data": dataRows
            };
        }
        return report;
    }

    function _putComment(objType, objId, comment) {
        let currentState = Pqf.lcy.getObjectState(objType, objId);
        if (currentState) {
            let transitions = Pqf.lcy.getStateTransitions(currentState.id);
            if (transitions) {
                transitions = transitions.filter(trans => trans.to.id == currentState.id);
                if (transitions && transitions.length > 0) {
                    let transitionId = transitions.shift().id;
                    Pqf.lcy.upgradeObject(objType, objId, transitionId, comment);
                }
            }
        }
    }

    function _sendErrorAlert(receivers, alertTypes) {
        // Sends an alert email with infos about the errors found in the console log.
        // Arguments:
        // - receivers = array of strings (email addresses)
        // - alertTypes (optional) = array of strings (default = ["ERROR"])
        alertTypes = typeof alertTypes !== "undefined" ? alertTypes : ["ERROR"];

        let consoleOutput = Pqf.atm.getJavaScriptConsole();
        let errors = consoleOutput.logs.filter(function (itm) {
            return ALERT_TYPES.indexOf(itm.type) > -1;
        });
        let errorsBySandboxId = _.groupBy(errors, function (error) {
            return error.sandboxId;
        });

        if (errors && errors.length > 0) {
            let hostUrl = Pqf.main.getStartUrl();
            let tenant = Pqf.pf.getCurrentTenant();
            let message = "<h3>Error Report for Tenant " + hostUrl + "</h3>";
            message += errors.length + " errors found in the last 24h</p>";

            const sandboxIds = Object.keys(errorsBySandboxId);
            sandboxIds.forEach((sandboxId) => {
                let sandbox = Pqf.atm.getJavaScriptSource(sandboxId);
                message += "<p>Sandbox: <b>" + sandbox.name + "</b> (" + sandboxId + ")<ul>";
                errorsBySandboxId[sandboxId].forEach(function (err) {
                    message += "<li>" + moment(err.timestamp).format("DD.MM.YYYY, HH:mm:ss") + ": " + err.text + "</li>";
                });
                message += "</ul></p>";
            });

            console.log("Tenant " + tenant.id + ": " + errors.length + " errors found in the last 24h");
            _sendSimpleNotificationMail(receivers, "JS Errors", null, message, null);
        } else {
            console.log("No errors found.");
        }
    }

    function _decodeOrNull(str) {
        let obj = null;
        try {
            obj = _decode(str);
        } catch (err) {
            console.error("Could not decode this string:" + str);
            console.error(err.message);
        }
        return obj;
    }

    function _setIndicatorSelection2(projectId, reportTypeId, indicatorSelection, doRetainTargetValues, template) {
        // Sets the indicator selection of a project.
        // Arguments:
        // - projectId = ID of the project
        // - reportTypeId = ID of the report type for which the indicator selection is to be set
        // - indicatorSelection = JSON, needs to conform to the return value of Pqf.pm.getIndicatorSelections
        // - doRetainTargetValues (optional) = boolean, if true then target values and comments are retained (otherwise deleted)
        // - template (optional) = JSON, indicator selection from which the target values and comments are taken (if null or not present then those values are taken from indicator selection via API)
        doRetainTargetValues = typeof doRetainTargetValues !== "undefined" ? doRetainTargetValues : true;
        template = typeof template !== "undefined" ? template : null;

        if (doRetainTargetValues) {
            if (!template) {
                template = Pqf.pm.getIndicatorSelections(projectId, reportTypeId);
            }
            indicatorSelection = JSON.parse(JSON.stringify(indicatorSelection)); // clone because we are changing some members of this JSON
            indicatorSelection = _indSelUpdateTargetValues(indicatorSelection, template);
        }
        Pqf.pm.putIndicatorSelections(projectId, reportTypeId, indicatorSelection);
    }

    function _setIndicatorSelection(projectId, reportTypeId, indicatorSelection, doRetainTargetValues) {
        _setIndicatorSelection2(projectId, reportTypeId, indicatorSelection, doRetainTargetValues, null);
    }

    function _indSelUpdateTargetValues(template, orig) {
        // Takes the target values from orig and maps them onto template. template will be changed.
        // Arguments:
        // -  template = JSON object as obtained from the API call Pqf.pm.getIndicatorSelections
        // -  orig = JSON object as obtained from the API call Pqf.pm.getIndicatorSelections
        //
        // If orig == null then the template values will be reset.
        //
        if (orig == null) {

            if (template.dimensions) {
                template.dimensions.forEach(function (dim) {
                    if (dim.details) {
                        dim.details.forEach(function (det) {
                            det.targetValue = null;
                            det.remark = null;
                        });
                    }
                });
            }

        } else {

            if (orig.dimensions) {
                orig.dimensions.forEach(function (dim) {
                    if (dim.details) {
                        dim.details.forEach(function (det) {
                            if (det.targetValue) { // Copy target value into template
                                _indSelCopyValue(template, dim.dimension, det.typeId, "targetValue", det.targetValue);
                            }
                            if (det.remark) { // Copy remark into template
                                _indSelCopyValue(template, dim.dimension, det.typeId, "remark", det.remark);
                            }
                        });
                    }
                });
            }

        }
        return template;
    }

    function _indSelCopyValue(template, dimId, detId, memberId, value) {
        let dimension = null;
        if (template.dimensions) {
            dimension = template.dimensions.find(x => x.dimension == dimId);
        }
        if (dimension) {
            let detail = null;
            if (dimension.details) {
                detail = dimension.details.find(x => x.typeId == detId);
            }
            if (detail) {
                detail[memberId] = value;
            }
        }
    }

    function _transferPropertiesOnLifecycleChange(transferMap, projectId) {
        // Arguments:
        // transferMap = Array of JSON objects of the following kind:
        // 	{
        // 		"triggeringLifecyceStates": [ // Array of relevant states (strings or objects)
        // 			"19BC14975D42458C8C5B42851284C335", // String: ID of the "to" state
        //			{"from": "7FE6FE4B19A74F78B1918AF5E7B34C8D", "to": "19BC14975D42458C8C5B42851284C335"} // Object with IDs of "from" and "to" states
        // 		],
        // 		"sourceObjectType": "ProjectIdea",
        // 		"targetObjectType": "ProjectAssignment",
        // 		"propertyMapping": [
        // 			{
        // 				"sourcePropertyId": "prjidea-mgmt-summary",
        // 				"targetPropertyId": "prjass-mgmt-summary"
        // 			}
        // 		]
        // 	}
        // projectId = ID of the triggering project (string)

        let currentProject = null;
        let lifecycleHistory = null;
        try {
            projectId = (typeof projectId === "undefined" ? project.id : projectId); // for backward compatibility: Get project ID from global variable 'project' if undefined
            currentProject = Pqf.pm.getProject(projectId);
            lifecycleHistory = Pqf.lcy.getObjectHistory("Project", projectId);
            currentProject.to = (lifecycleHistory.length > 0 ? lifecycleHistory[lifecycleHistory.length - 1].state.id : null);
            _log(_debuggingMode, "log", null, "Project state now: " + currentProject.to);
            currentProject.from = (lifecycleHistory.length > 1 ? lifecycleHistory[lifecycleHistory.length - 2].state.id : null);
            _log(_debuggingMode, "log", null, "Project state before: " + currentProject.from);
        } catch (err) {
            _log(1, "error", "FDC464BD7EE14459871810896323B718", err);
        }
        if (currentProject && lifecycleHistory) {
            transferMap.forEach(function (transferRule) {
                let isRuleRelevant = false;
                transferRule.triggeringLifecyceStates.forEach(function (triggeringState) {
                    switch (typeof triggeringState) {
                    case "string":
                        isRuleRelevant = (triggeringState == currentProject.to);
                        break;
                    case "object":
                        isRuleRelevant = (triggeringState.to == currentProject.to && triggeringState.from == currentProject.from);
                        break;
                    default:
                    }
                });
                if (isRuleRelevant) {
                    _log(_debuggingMode ? 1 : 0, "log", null, "Rule is relevant");
                    _transferPropertyValues(currentProject.id, transferRule.sourceObjectType, transferRule.targetObjectType, transferRule.propertyMapping);
                } else {
                    _log(_debuggingMode ? 1 : 0, "log", null, "Rule is NOT relevant");
                }
            });
        } else {
            _log(_debuggingMode ? 1 : 0, "warn", null, "Project and/or lifecycle history not defined in function _transferPropertiesOnLifecycleChange");
        }
    }

    function _transferPropertyValues(projectId, sourceObjectType, targetObjectType, propertyMapping) {
        let sourceObject = null;
        let targetObject = null;
        let targetProperty = null;
        let sourceProperty = null;

        _log(_debuggingMode ? 1 : 0, "log", null, "Transferring property values on project " + projectId);
        try {
            switch (sourceObjectType) {
            case "Project":
                sourceObject = Pqf.pm.getProject(projectId);
                break;
            default:
                sourceObject = Pqf.pm.getProjectSubObj(projectId, sourceObjectType);
            }
            switch (targetObjectType) {
            case "Project":
                targetObject = Pqf.pm.getProject(projectId);
                break;
            default:
                targetObject = Pqf.pm.getProjectSubObj(projectId, targetObjectType);
            }
        } catch (err) {
            _log(1, "error", "92B66AF6BAAF4DD8B39F184956FECA6C", err);
        }
        if (sourceObject && targetObject) {
            propertyMapping.forEach(function (map) {
                targetProperty = targetObject.properties.find(x => x.key === map.targetPropertyId);
                if (targetProperty) {
                    sourceProperty = sourceObject.properties.find(x => x.key === map.sourcePropertyId);
                    if (sourceProperty) {
                        let newValue = sourceProperty.value;
                        if (newValue) {
                            _log(_debuggingMode ? 1 : 0, "log", null, "Transferring property value " + newValue + " from " + map.sourcePropertyId + " to " + map.targetPropertyId);
                            if (map.listMap) { // property is a dynamics list, we need to replace the containted property ids
                                map.listMap.forEach(function (propertyMap) {
                                    newValue = _replaceAll(newValue, propertyMap.from, propertyMap.to);
                                });
                            }
                        }
                        targetProperty.value = newValue;
                    }
                }
            });
            try {
                if (_mockingMode) {
                    _log(_debuggingMode ? 1 : 0, "log", null, "MOCK: Saving target object");
                } else {
                    _log(_debuggingMode ? 1 : 0, "log", null, "Saving target object");
                    switch (targetObjectType) {
                    case "Project":
                        Pqf.pm.putProject(projectId, targetObject);
                        break;
                    default:
                        Pqf.pm.putProjectSubObj(projectId, targetObjectType, targetObject);
                    }
                }
            } catch (err) {
                _log(1, "error", "074C8366190A4E1196654CB3832B56DB", err);
            }
        }
    }

    /**
     * Creates a PQF JSON object (i.e., a report) and saves it as a document in a PQFORCE object.
     * @param {(string|Object)} docName - Name of the document created, or an object with name and description
     * @param {string} docName.name - Name of the document created
     * @param {string} [docName.desc="Per JS am [timestamp] generiert"] - Description of the document created, [timestamp] will be replaced by the current timestamp
     * @param {Object} pqfObject - Object that the report will be linked to as a document
     * @param {string} pqfObject.type - Type of the PQFORCE object that the report will be attached to as a document
     * @param {string} pqfObject.id - ID of the PQFORCE object that the report will be attached to as a document
     * @param {string} [folderId=null] - ID of the folder into which the report will be saved (null = root folder)
     * @param {(Object|function)} report - JSON object that represents the report, or a function that generates the JSON object that will be used as a report
     * @return null
     */
    function _createAndSave(docName, pqfObject, folderId, report) {
        let now = moment();

        let myDocName = null;
        let myDocDesc = null;
        if (typeof docName == "string") {
            myDocName = docName;
            myDocDesc = "Am " + now.format("DD.MM.YYYY HH:mm:ss") + " mit JS generiert";
        } else if (typeof docName == "object") {
            myDocName = docName.name;
            myDocDesc = docName.desc;
        } else {
            throw new Error("Argument 'docName' invalid.");
        }

        let myObjectType = null;
        let myObjectId = null;
        if (typeof pqfObject == "object" && pqfObject !== null) {
            myObjectType = pqfObject.type;
            myObjectId = pqfObject.id;
        } else {
            throw new Error("Argument 'pqfObject' invalid.");
        }

        let myFolderId = null;
        if (folderId == null || (typeof folderId == "string")) {
            myFolderId = folderId;
        } else {
            throw new Error("Argument 'folderId' invalid.");
        }

        let myReport = null;
        if (typeof report == "object") {
            myReport = report;
        } else if (typeof report == "function") {
            myReport = report();
        } else {
            throw new Error("Argument 'report' invalid.");
        }

        let mimeType = "application/x.pqf.table.json";
        let jsonDoc = {
            "mimeType": "application/x.pqf.table.json",
            "type": "JsProjectExport",
            "id": myReport.id,
            "code": myReport.code,
            "name": myReport.name,
            "description": myReport.desc,
            "createdAt": now.toISOString(),
            "createdBy": _getCurrentUserName(),
            "meta": myReport.meta,
            "data": myReport.data
        };
        Pqf.pf.addAttachmentJsonAndLink(myObjectType, myObjectId, mimeType, myDocName, null, myDocDesc, null, myFolderId, jsonDoc);
    }

    function _getRemainingJsQuota(unit) {
        unit = (typeof unit !== "undefined" ? unit : "S"); // optional argument, default: unit = "S" (seconds), alternative: "M" (minutes)
        let quota = Pqf.atm.getJavaScriptQuota();
        let used = 0;
        let max = 0;
        switch (unit) {
        case "M":
            used = moment.duration(quota.used).asMinutes();
            max = moment.duration(quota.max).asMinutes();
            break;
        default:
            used = moment.duration(quota.used).asSeconds();
            max = moment.duration(quota.max).asSeconds();
        }
        return max - used;
    }

    function _durationInHoursToMoment(durationString) {
        let duration = null;
        let seconds = 0;
        if (durationString.includes(":")) { // assume clock notation, e.g., "5:20:45"
            duration = moment.duration(durationString); // moment accepts this notation
        } else { // assume decimal number (string), e.g., "5.37" or "5,37"
            let multiplier = parseFloat(durationString.replace(",", "."));
            if (isNaN(multiplier))
                multiplier = 0;
            duration = moment.duration({
                "seconds": 3600 * multiplier
            });
        }
        return duration;
    }

    // Writes messages to the console log.
    // Arguments:
    //  - level: non-negative integer (0, 1, 2,...)
    //  - type: "log" | "warn" | "error"
    //  - id: string | null
    //  - messages: string | array of JSON objects (typically just strings)
    /**
     * Writes messages to the console log.
     * @param {number} level - Non-negative integer (0, 1, 2,...)
     * @param {string} type - "log" | "warn" | "error"
     * @param {string} [id=null] - ID of the code location where the log
     *   message is generated
     * @param {(string|Array)} messages - String or array of JSON objects
     *   (typically just strings) describing the log message
     * @return null
     * @example
     * _log(_debuggingMode ? 1 : 0, "log", null, "This is a log message.");
     * _log(1, "error", "763F78F4BF614A80B19564B67C1514A3", ["argument 'type' must be one of " + JSON.stringify(LOG_TYPES), "currently it is " + type]);
     */
    function _log(level, type, id, messages) {
		messages = (typeof messages === "undefined" ? "" : messages);
        const LOG_TYPES = ["log", "warn", "error"];
        if (LOG_TYPES.includes(type)) {
            switch (level) {
            case 0: // don't log anything
                break;
            default:
                if (id && (typeof id === "string" || id instanceof String)) {
                    console[type]("Code location: " + id);
                }
				if (typeof messages === "string" || messages instanceof String) {
					console[type](messages);
				} else if (Array.isArray(messages)) {
					messages.forEach(function (msg) {
						if (typeof msg === "string" || msg instanceof String) {
							console[type](msg);
						} else {
							console[type](JSON.stringify(msg));
						}
					});
				} else {
					console[type](JSON.stringify(messages));
				}
            }
        } else {
            _log(1, "error", "763F78F4BF614A80B19564B67C1514A3", ["argument 'type' must be one of " + JSON.stringify(LOG_TYPES), "currently it is " + type]);
        }
    }

    // Get the language of a user by its name and/or email
    function _getUserLanguage(name, email) {
        let users = Pqf.acm.getUsers(name, null, null, email);
        if (!users || !users.length)
            return null;
        let langs = users.filter((usr) => usr.language).map((usr) => usr.language);
        return langs.length ? langs[0] : null;
    }

    function _MD5(d) {
        function M(d) {
            for (var _, m = "0123456789ABCDEF", f = "", r = 0; r < d.length; r++)
                _ = d.charCodeAt(r), f += m.charAt(_ >>> 4 & 15) + m.charAt(15 & _);
            return f;
        }
        function X(d) {
            for (var _ = Array(d.length >> 2), m = 0; m < _.length; m++)
                _[m] = 0;
            for (m = 0; m < 8 * d.length; m += 8)
                _[m >> 5] |= (255 & d.charCodeAt(m / 8)) << m % 32;
            return _;
        }
        function V(d) {
            for (var _ = "", m = 0; m < 32 * d.length; m += 8)
                _ += String.fromCharCode(d[m >> 5] >>> m % 32 & 255);
            return _;
        }
        function Y(d, _) {
            d[_ >> 5] |= 128 << _ % 32,
            d[14 + (_ + 64 >>> 9 << 4)] = _;
            for (var m = 1732584193, f = -271733879, r = -1732584194, i = 271733878, n = 0; n < d.length; n += 16) {
                let h = m,
                t = f,
                g = r,
                e = i;
                f = md5_ii(f = md5_ii(f = md5_ii(f = md5_ii(f = md5_hh(f = md5_hh(f = md5_hh(f = md5_hh(f = md5_gg(f = md5_gg(f = md5_gg(f = md5_gg(f = md5_ff(f = md5_ff(f = md5_ff(f = md5_ff(f, r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 0], 7, -680876936), f, r, d[n + 1], 12, -389564586), m, f, d[n + 2], 17, 606105819), i, m, d[n + 3], 22, -1044525330), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 4], 7, -176418897), f, r, d[n + 5], 12, 1200080426), m, f, d[n + 6], 17, -1473231341), i, m, d[n + 7], 22, -45705983), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 8], 7, 1770035416), f, r, d[n + 9], 12, -1958414417), m, f, d[n + 10], 17, -42063), i, m, d[n + 11], 22, -1990404162), r = md5_ff(r, i = md5_ff(i, m = md5_ff(m, f, r, i, d[n + 12], 7, 1804603682), f, r, d[n + 13], 12, -40341101), m, f, d[n + 14], 17, -1502002290), i, m, d[n + 15], 22, 1236535329), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 1], 5, -165796510), f, r, d[n + 6], 9, -1069501632), m, f, d[n + 11], 14, 643717713), i, m, d[n + 0], 20, -373897302), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 5], 5, -701558691), f, r, d[n + 10], 9, 38016083), m, f, d[n + 15], 14, -660478335), i, m, d[n + 4], 20, -405537848), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 9], 5, 568446438), f, r, d[n + 14], 9, -1019803690), m, f, d[n + 3], 14, -187363961), i, m, d[n + 8], 20, 1163531501), r = md5_gg(r, i = md5_gg(i, m = md5_gg(m, f, r, i, d[n + 13], 5, -1444681467), f, r, d[n + 2], 9, -51403784), m, f, d[n + 7], 14, 1735328473), i, m, d[n + 12], 20, -1926607734), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 5], 4, -378558), f, r, d[n + 8], 11, -2022574463), m, f, d[n + 11], 16, 1839030562), i, m, d[n + 14], 23, -35309556), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 1], 4, -1530992060), f, r, d[n + 4], 11, 1272893353), m, f, d[n + 7], 16, -155497632), i, m, d[n + 10], 23, -1094730640), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 13], 4, 681279174), f, r, d[n + 0], 11, -358537222), m, f, d[n + 3], 16, -722521979), i, m, d[n + 6], 23, 76029189), r = md5_hh(r, i = md5_hh(i, m = md5_hh(m, f, r, i, d[n + 9], 4, -640364487), f, r, d[n + 12], 11, -421815835), m, f, d[n + 15], 16, 530742520), i, m, d[n + 2], 23, -995338651), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 0], 6, -198630844), f, r, d[n + 7], 10, 1126891415), m, f, d[n + 14], 15, -1416354905), i, m, d[n + 5], 21, -57434055), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 12], 6, 1700485571), f, r, d[n + 3], 10, -1894986606), m, f, d[n + 10], 15, -1051523), i, m, d[n + 1], 21, -2054922799), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 8], 6, 1873313359), f, r, d[n + 15], 10, -30611744), m, f, d[n + 6], 15, -1560198380), i, m, d[n + 13], 21, 1309151649), r = md5_ii(r, i = md5_ii(i, m = md5_ii(m, f, r, i, d[n + 4], 6, -145523070), f, r, d[n + 11], 10, -1120210379), m, f, d[n + 2], 15, 718787259), i, m, d[n + 9], 21, -343485551),
                m = safe_add(m, h),
                f = safe_add(f, t),
                r = safe_add(r, g),
                i = safe_add(i, e);
            }
            return Array(m, f, r, i);
        }
        function md5_cmn(d, _, m, f, r, i) {
            return safe_add(bit_rol(safe_add(safe_add(_, d), safe_add(f, i)), r), m);
        }
        function md5_ff(d, _, m, f, r, i, n) {
            return md5_cmn(_ & m | ~_ & f, d, _, r, i, n);
        }
        function md5_gg(d, _, m, f, r, i, n) {
            return md5_cmn(_ & f | m & ~f, d, _, r, i, n);
        }
        function md5_hh(d, _, m, f, r, i, n) {
            return md5_cmn(_ ^ m ^ f, d, _, r, i, n);
        }
        function md5_ii(d, _, m, f, r, i, n) {
            return md5_cmn(m ^ (_ | ~f), d, _, r, i, n);
        }
        function safe_add(d, _) {
            let m = (65535 & d) + (65535 & _);
            return (d >> 16) + (_ >> 16) + (m >> 16) << 16 | 65535 & m;
        }
        function bit_rol(d, _) {
            return d << _ | d >>> 32 - _;
        }
        let r = M(V(Y(X(d), 8 * d.length)));
        return r.toLowerCase();
    }

    /**
     * Creates a new object with a subset of the properties of the given object.
     * The resulting object can then be interpreted by the client as an enum
     * object (inlcuding, e.g., an icon reference and a color).
     *
     * @param {Object} obj - The object to be converted.
     * @returns {Object} - The enum object.
     */
    function _toEnum(obj) {
        if (!obj) {
            return null;
        }
        return {
            'type': obj.type,
            'id': obj.id,
            'name': obj.name +
            (obj.isDeleted ? " (deleted)" : ""),
            'description': obj.description,
            'iconRef': obj.iconRef,
            'color': obj.color
        };
    }

    function _isInteger(value) {
        return !isNaN(value) && parseInt(Number(value)) == value && !isNaN(parseInt(value, 10));
    }
	
	function _toArrayOfIntegers(myString, separator) {
		separator = (typeof separator === "undefined" ? "," : separator);
		return myString?.split(separator)
			.map(d => parseInt(d))
			.filter(n => isNaN(n) ? false : true) || [];
	}

    function _getHtmlTemplate() {
        return _DEFAULT_MAIL_PARAMS.bodyHtmlTemplate;
    }

    function _getHtmlVerticalSeparator(color) {
		color = (typeof color == "undefined" ? "black" : color);
        let html = _DEFAULT_MAIL_PARAMS.bodyHtmlVerticalSeparator;
		html = _replaceAll(html, "[[color]]", color);
		return html;
    }

    function _getHtmlHorizontalLine(color) {
		color = (typeof color == "undefined" ? "black" : color);
        let html = _DEFAULT_MAIL_PARAMS.bodyHtmlHorizontalLine;
		html = _replaceAll(html, "[[color]]", color);
		return html;
    }

    function _getHtmlMessageTemplate(type) {
        switch (type) {
        case "dark":
            return _DEFAULT_MAIL_PARAMS.bodyHtmlMessageDarkBox;
        case "light":
            return _DEFAULT_MAIL_PARAMS.bodyHtmlMessageLightBox;
        default:
            return _DEFAULT_MAIL_PARAMS.bodyHtmlMessagePlain;
        }
    }

    function _mapCurrency(currencyId) { 
        if (!currencyId) { return null; }
        let currency = _exec(Pqf.fco, Pqf.fco.getCurrency, currencyId);
        return currency ? currency.code : null;
    }

    /**
     * Executes a function and catches potential errors. In case of an error,
     * the error is logged and null is returned.
     *
     * @param {Object} obj - The object to which the function belongs.
     * @param {Function} func - The function to be executed.
     * @param {Array} params - The parameters of the function.
     * @returns {Any} - The result of the function or null in case of an error.
     */
    function _exec(obj, func, ...params) {
        // Pop trailing nulls from params
        while (params.length > 0 && !params[params.length - 1]) {
            params.pop();
        }
        return _exec_arr(obj, func, params);
    }

    /**
     * Executes a function with an array of parameters and catches potential
     * errors. In case of an error, the error is logged and null is returned.
     * The params array must be an array of properties, empty elements are not
     * allowed.
     *
     * @param {Object} obj - The object to which the function belongs.
     * @param {Function} func - The function to be executed.
     * @param {Array} params_arr - The parameters of the function.
     * @returns {Any} - The result of the function or null in case of an error.
     */
    function _exec_arr(obj, func, params_arr) {
        try {
            return func.apply(obj, params_arr);
        } catch (error) {
            let message =
                "Executing function " + func.name + " with parameters " +
                JSON.stringify(params_arr) + " resulted in the following " +
                "error: " + error;
            _log(_debuggingMode ? 1 : 0, "warn", null, message);
            return null;
        }
    }

    // -------------------------------------------------------------------------
    // Function set for DocLinks
    // -------------------------------------------------------------------------

    /**
     * Creates a new document link with the given document. The created document
     * link is returned.
     *
     * @param {Object} docLinkInfo - Object specifying the created docLink.
     * @param {Object} docLinkInfo.parentType - The type of the parent object
     *   the document link is attached to.
     * @param {String} docLinkInfo.parentId - The ID of the parent object the
     *   document link is attached to.
     * @param {String} docLinkInfo.mimeType - The MIME type of the document.
     * @param {String} docLinkInfo.name - The name of the docLink. This
     *   is the name that is displayed in the "Documents" view of the parent
     *   object.
     * @param {String} [docLinkInfo.code=null] - The code of the docLink. If
     *   not given, the code is set to null.
     * @param {String} [docLinkInfo.description=null] - The description of the
     *   docLink. If not given, the description will be a timestamp and some
     *   information about the user who created the docLink.
     * @param {String} [docLinkInfo.sortindex=null] - The sortindex of the
     *   docLink. If not given, the sortindex is set to null.
     * @param {String} [docLinkInfo.folder=null] - The folder of the docLink. If
     *   not given, the folder is set to null (i.e., the root folder).
     * @param {String} [docLinkInfo.encoding=null] - The encoding of the
     *   document. Only relevant for text documents.
     * @param {String|Object} document - The document to be uploaded.
     * @param {String} documentType - The type of the document. Possible values
     *   are "binary", "text", and "json".
     * @returns {Object} - The created document link object. null if an error
     *   occurred.
     * @example
     * let docLinkInfo = {
     *   "parentType": "Project",
     *   "parentId": "74DC72CCC6A64961B15FE3D03DEC7A69",
     *   "mimeType": "application/x.pqf.table.json", // JTF
     *   "name": "Allocation Overview"
     * };
     * let document = _createJtf(); // Function to create a JTF
     * let docLink = pqfImportHelperLib.docLink.createDocLinkWithDocument(
     *   docLinkInfo, document, "json");
     * docLink;
     * // returns
     * { // document link object
     *   "type": "Project/DocumentLink",
     *   "id": "DCAF5E3623CF4F528DF115EE6C935806",
     *   ...
     * }
     */
    function _createDocLinkWithDocument(docLinkInfo, document, documentType) {
        // Apply default values
        if (!docLinkInfo.code) {
            docLinkInfo.code = null;
        }
        if (!docLinkInfo.description) {
            let user = _exec(Pqf.acm, Pqf.acm.getCurrentUser);
            let userName = user ?
                (user.resource ? user.resource.name : user.name) :
                "unknown user";
            docLinkInfo.description =
                "Created by " + userName + " on " +
                moment().format("YYYY-MM-DD HH:mm:ss");
        }
        if (!docLinkInfo.sortindex) {
            docLinkInfo.sortindex = null;
        }
        if (!docLinkInfo.folder) {
            docLinkInfo.folder = null;
        }
        if (!docLinkInfo.encoding) {
            docLinkInfo.encoding = null;
        }
        // Check if a docLink with the same name already exists in this folder.
        // If so, delete it.
        let docLinks = _exec(
                Pqf.pf, Pqf.pf.getDocumentLinks, docLinkInfo.parentType,
                docLinkInfo.parentId, docLinkInfo.folder);
        if (docLinks) {
            docLinks.forEach(docLink => {
                // Get attachment name and handle spaces
                let attName = _getAttachmentNameFromUrl(docLink.url);
                if (attName) {
                    attName = attName.replace(/%20/g, " ");
                }
                // If name matches, delete the document link
                if (attName == docLinkInfo.name) {
                    _exec(
                        Pqf.pf, Pqf.pf.delDocumentLink, docLinkInfo.parentType,
                        docLinkInfo.parentId, docLink.id);
                }
            });
        }
        // Create function map
        const funcMap = {
            "binary": {
                "func": Pqf.pf.addAttachmentBinaryAndLink,
                "params": [
                    docLinkInfo.parentType, docLinkInfo.parentId,
                    docLinkInfo.mimeType, docLinkInfo.name, docLinkInfo.code,
                    docLinkInfo.description, docLinkInfo.sortindex,
                    docLinkInfo.folder, document]
            },
            "text": {
                "func": Pqf.pf.addAttachmentTextAndLink,
                "params": [
                    docLinkInfo.parentType, docLinkInfo.parentId,
                    docLinkInfo.mimeType, docLinkInfo.name, docLinkInfo.code,
                    docLinkInfo.description, docLinkInfo.sortindex,
                    docLinkInfo.folder, docLinkInfo.encoding, document]
            },
            "json": {
                "func": Pqf.pf.addAttachmentJsonAndLink,
                "params": [
                    docLinkInfo.parentType, docLinkInfo.parentId,
                    docLinkInfo.mimeType, docLinkInfo.name, docLinkInfo.code,
                    docLinkInfo.description, docLinkInfo.sortindex,
                    docLinkInfo.folder, document]
            }
        };
        // Check if document type is supported
        if (!funcMap[documentType]) {
            let message =
                "Document type " + documentType + " not supported by " +
                "function _createDocLinkWithDocument.";
                _log(_debuggingMode ? 1 : 0, "error", null, message);
            return;
        }
        // Save document and return the created document link
        let attachmentLink = _exec_arr(
                Pqf.pf, funcMap[documentType].func, funcMap[documentType].params);
        if (!attachmentLink) {
            return;
        }
        let docLink = _exec(
                Pqf.pf, Pqf.pf.getDocumentLink, docLinkInfo.parentType,
                docLinkInfo.parentId, attachmentLink.id);
        return docLink;
    }

    /**
     * Get the document link by its ID.
     *
     * @param {Object} docLinkId - The document link ID.
     * @returns {Object} - The document link object.
     * @example
     * let docLink = pqfImportHelperLib.docLink.get("DCAF5E3623CF4F528DF115EE6C935806");
     * docLink;
     * // returns
     * { // document link object
     *   "type": "LibraryModule/DocumentLink",
     *   "id": "DCAF5E3623CF4F528DF115EE6C935806",
     *    ...
     * }
     */
    function _getDocLink(docLinkId) {
        // Get parent reference
        let parent = _exec(Pqf.pf, Pqf.pf.getDocumentLinkParent, docLinkId);
        if (!parent)
            return;
        // Return document link
        return _exec(
            Pqf.pf, Pqf.pf.getDocumentLink, parent.type, parent.id, docLinkId);
    }

    /**
     * Get the "raw" document of the given document link. The document is
     * returned as a binary, text, or JSON object, depending on the MIME type of
     * the document.
     *
     * @param {Object} docLink - The Document Link object for which the document
     *   should be retrieved.
     * @param {String} [encoding=null] - The encoding of the document. Only
     *   relevant for text documents.
     * @returns {Object} - The document object. null if an error occurred.
     * @example
     * let docLink = pqfImportHelperLib.docLink.get("DCAF5E3623CF4F528DF115EE6C935806");
     * let document = pqfImportHelperLib.docLink.getDocument(docLink);
     * document;
     * // returns
     * ... // binary, text, or JSON object
     */
    function _getDocument(docLink, encoding) {
        // Get the attachment details
        let attachmentId = _getAttachmentIdFromUrl(
                docLink.url);
        if (!attachmentId) {
            let message =
                "Failed to get the attachment ID for docLink " + docLink.id;
            _log(_debuggingMode ? 1 : 0, "error", null, message);
            return;
        }
        let attachmentDetails = _exec(
                Pqf.pf, Pqf.pf.getAttachmentDetails, attachmentId);
        if (!attachmentDetails) {
            let message =
                "Failed to get the attachment details for docLink " +
                docLink.id + " and attachment ID " + attachmentId;
            _log(_debuggingMode ? 1 : 0, "error", null, message);
            return;
        }
        // Get the document
        const funcMap = {
            "binary": {
                "func": Pqf.pf.getAttachmentBinary,
                "params": [attachmentId]
            },
            "text": {
                "func": Pqf.pf.getAttachmentText,
                "params": encoding ? [attachmentId, encoding] : [attachmentId]
            },
            "json": {
                "func": Pqf.pf.getAttachmentJson,
                "params": [attachmentId]
            }
        };
        let document = null;
        Object.keys(funcMap).forEach(key => {
            if (attachmentDetails.mimeType.includes(key)) {
                document = _exec_arr(
                        Pqf.pf, funcMap[key].func, funcMap[key].params);
            }
        });
        if (!document) {
            let message =
                "Failed to get the document for docLink " + docLink.id;
            _log(_debuggingMode ? 1 : 0, "error", null, message);
        }
        return document;
    }

    /**
     * Updates the document of the given document link, i.e., replaces the
     * attachment the document link is pointing to with the given document.
     *
     * @param {Object} docLink - The Document Link object for which the document
     *   (i.e., attachment) should be updated.
     * @param {Object|String} document - The document to be uploaded.
     * @param {String} documentType - The type of the document. Possible values
     *   are "binary", "text", and "json".
     * @param {String} mimeType - The MIME type of the document. This value is
     *   particularly important for JTFs ("application/x.pqf.table.json").
     * @param {String} [encoding=null] - The encoding of the document. Only
     *   relevant for text documents.
     * @returns {Object} - The updated document link object.
     * @example
     * let docLink = pqfImportHelperLib.docLink.get("DCAF5E3623CF4F528DF115EE6C935806");
     * let document = "This is a text document.";
     * let updatedDocLink = pqfImportHelperLib.docLink.updateDocLinkDocument(docLink, document, "text", "text/plain", "utf-8");
     * updatedDocLink;
     * // returns
     * { // updated document link object
     *   ...
     *   "url": "../PF/V1/Attachment/NEWATTACHMENTID?name=20241121 Upload Employee 66014 (1).csv",
     *   ...
     * }
     */
    function _updateDocLinkDocument(
        docLink, document, documentType, mimeType, encoding) {
        if (typeof encoding === "undefined")
            encoding = null;
        // Upload the given document
        const funcMap = {
            "binary": {
                "func": Pqf.pf.addAttachmentBinary,
                "params": [mimeType, document]
            },
            "text": {
                "func": Pqf.pf.addAttachmentText,
                "params": [mimeType, encoding, document]
            },
            "json": {
                "func": Pqf.pf.addAttachmentJson,
                "params": [mimeType, document]
            }
        };
        if (!funcMap[documentType]) {
            let message =
                "Document type " + documentType + " not supported by " +
                "function _updateDocLinkDocument.";
                _log(_debuggingMode ? 1 : 0, "error", null, message);
            return;
        }
        let attachmentDetails = _exec_arr(
                Pqf.pf, funcMap[documentType].func, funcMap[documentType].params);
        if (!attachmentDetails) {
            return;
        }
        // Update the document link
        docLink.url = _replaceAttachmentIdInUrl(
                docLink.url, attachmentDetails.id);
        docLink.mimeType = mimeType;
        let parent = _exec(
                Pqf.pf, Pqf.pf.getDocumentLinkParent, docLink.id);
        if (!parent) {
            return;
        }
        _exec(
            Pqf.pf, Pqf.pf.putDocumentLink, parent.type, parent.id, docLink.id,
            docLink);
        return docLink;
    }

    /**
     * Parses the given URL and returns the attachment ID this URL is pointing
     * to.
     *
     * @param {String} url - The URL of the attachment.
     * @returns {String} - The attachment ID. null if not found.
     * @example
     * docLink.url = "../PF/V1/Attachment/BPBHRSTRORYTXFMAVNR2ZM3JOF56GSCESZFSATJKUTGPHCQWMEPQ?name=20241121 Upload Employee 66014 (1).csv";
     * let attachmentId = pqfImportHelperLib.docLink.getAttachmentIdFromUrl(docLink.url);
     * attachmentId;
     * // returns
     * "BPBHRSTRORYTXFMAVNR2ZM3JOF56GSCESZFSATJKUTGPHCQWMEPQ"
     */
    function _getAttachmentIdFromUrl(url) {
        if (!url) {
            return null;
        }
        let matches =
            url.match(/\.\.\/PF\/V1\/Attachment\/(.*)\?name=/) ||
            url.match(/\/API\/V2\/PF\/Attachment\/(.*)\?name=/);
        return matches && matches.length > 1 ? matches[1] : null;
    }

    /**
     * Parses the given URL and returns the attachment name this URL is pointing
     * to.
     *
     * @param {String} url - The URL of the attachment.
     * @returns {String} - The attachment name. null if not found.
     * @example
     * docLink.url = "../PF/V1/Attachment/BPBHRSTRORYTXFMAVNR2ZM3JOF56GSCESZFSATJKUTGPHCQWMEPQ?name=20241121 Upload Employee 66014 (1).csv";
     * let attachmentName = pqfImportHelperLib.docLink.getAttachmentNameFromUrl(docLink.url);
     * attachmentName;
     * // returns
     * "20241121 Upload Employee 66014 (1).csv"
     */
    function _getAttachmentNameFromUrl(url) {
        if (!url) {
            return null;
        }
        let matches =
            url.match(/\.\.\/PF\/V1\/Attachment\/.*\?name=(.*)/) ||
            url.match(/\/API\/V2\/PF\/Attachment\/.*\?name=(.*)/);
        return matches && matches.length > 1 ? matches[1] : null;
    }

    /**
     * Replaces the attachment ID in the given URL with the new attachment ID.
     *
     * @param {String} url - The URL of the attachment.
     * @param {String} newId - The new attachment ID.
     * @returns {String} - The URL with the new attachment ID.
     * @example
     * docLink.url = "../PF/V1/Attachment/BPBHRSTRORYTXFMAVNR2ZM3JOF56GSCESZFSATJKUTGPHCQWMEPQ?name=20241121 Upload Employee 66014 (1).csv";
     * let newUrl = pqfImportHelperLib.docLink.replaceAttachmentIdInUrl(docLink.url, "NEWATTACHMENTID");
     * newUrl;
     * // returns
     * "../PF/V1/Attachment/NEWATTACHMENTID?name=20241121 Upload Employee 66014 (1).csv"
     */
    function _replaceAttachmentIdInUrl(url, newId) {
        return url.replace(
            /Attachment\/(.*)\?(name|file)=/, "Attachment/" + newId + "?$2=");
    }

    // -------------------------------------------------------------------------
    // Function set for properties
    // -------------------------------------------------------------------------

    /**
     * Sets the properties of the given object. The properties are specified by
     * their IDs and values.
     *
     * @param {Object} obj - The object for which the properties should be
     *   updated.
     * @param {Object} execArgs - Specifies arguments needed to update the
     *   object. Its structure depends on the object type. Implemented (i.e.,
     *   supported) options are:
     *     - For objects of type "Project":
     *          { "funcType": "Project" }
     *     - For project subobjects:
     *         {
     *           "funcType": "ProjectSubObj",
     *           "prjId": "string" // ID of the project
     *         }
     *     - For objects of type "DocLink":
     *         {
     * 	         "funcType": "DocLink",
     * 	         "parentType": "string", // Type of object this docLink belongs to
     * 	         "parentId": "string"   // ID of the object this docLink belongs to
     *         }
     *     - For objects of type "Todo":
     *         {
     *           "funcType": "Todo"
     *         }
     * 	   - For objects of type "WorkItem":
     *         {
     *           "funcType": "WorkItem",
     *           "updateDependencies": "boolean"
     *         }
     * @param {String|Array} propIds - The ID of the property or an array of
     *   property IDs to be updated.
     * @param {String|Array} propValues - The value of the property or an array
     *   of property values to be set.
     * @returns {Object} - The updated object. null if an error occurred.
     */
    function _setProps(obj, execArgs, propIds, propValues) {
        // Define function map (depending on funcType)
        const funcMap = {
            "Project": {
                "module": Pqf.pm,
                "func": Pqf.pm.putProject,
                "args": [obj.id, obj]
            },
            "ProjectSubObj": {
                "module": Pqf.pm,
                "func": Pqf.pm.putProjectSubObj,
                "args": [execArgs.prjId, obj.type, obj]
            },
            "DocLink": {
                "module": Pqf.pf,
                "func": Pqf.pf.putDocumentLink,
                "args": [execArgs.parentType, execArgs.parentId, obj.id, obj]
            },
            "Todo": {
                "module": Pqf.pi,
                "func": Pqf.pi.putProjectItem,
                "args": ["Todo", obj.id, obj]
            },
            "WorkItem": {
                "module": Pqf.pm,
                "func": Pqf.pm.putWorkItem,
                "args": [obj.id, execArgs.updateDependencies, obj]
            }
        };
        // Handle propId and propValue given as strings
        if (typeof propIds === "string") {
            propIds = [propIds];
        }
        if (typeof propValues === "string" || propValues === null) {
            propValues = [propValues];
        }
        // Change property values
        function _changePropValue(propId, propValue) {
            let prop = obj.properties.find(objProp => objProp.key == propId);
            if (!prop) {
                let message =
                    "Property with ID " + propId + " not found in object " +
                    obj.id + " - skipped.";
                    _log(_debuggingMode ? 1 : 0, "error", "'_setProps'", message);
                return;
            }
            prop.value = propValue;
        }
        for (let i = 0; i < propIds.length; i++) {
            _changePropValue(propIds[i], propValues[i]);
        }
        // Save updated object
        _exec_arr(
            funcMap[execArgs.funcType].module, funcMap[execArgs.funcType].func,
            funcMap[execArgs.funcType].args);
        return obj;
    }

    /**
     * Checks if the given object has properties with the specified IDs and
     * values. The IDs and values are 'order sensitive', i.e., the first ID must
     * match the first value and so on.
     *
     * @param {Object} obj - The object to be checked.
     * @param {String|Array} propIds - The ID of the property or an array of
     *   property IDs to be checked.
     * @param {String|Array} propValues - The value of the property or an array
     *   of property values to be checked.
     * @returns {Boolean} - True if all properties with the given IDs have the
     *   specified values, false otherwise. null if an error occurred.
     * @example
     * let obj = pqfImportHelperLib.docLink.get("DCAF5E3623CF4F528DF115EE6C935806");
     * let propIds = ["doc-is-tr-overview", "doc-update-tr-overview"];
     * let propValues = ["X", "X"];
     * if (pqfImportHelperLib.docLink.checkProps(obj, propIds, propValues)) {
     *   ... // Update the document link
     * }
     */
    function _checkProps(obj, propIds, propValues) {
        // Handle propIds and propValues given as strings
        if (typeof propIds === "string") {
            propIds = [propIds];
        }
        if (typeof propValues === "string" || propValues === null) {
            propValues = [propValues];
        }
        // Check if all properties with the given IDs are present in the object
        let props = obj.properties.filter(prop => propIds.includes(prop.key));
        if (props.length != propIds.length) {
            let message =
                "Not all properties with IDs " + propIds + " found in object " +
                obj.id + ".";
                _log(_debuggingMode ? 1 : 0, "error", "'_checkProps'", message);
            return;
        }
        // Sort the filtered properties by the given IDs
        props.sort((a, b) => {
            return propIds.indexOf(a.key) - propIds.indexOf(b.key);
        });
        // Check if all properties have the given values
        let allMatch = true;
        props.forEach((prop, i) => {
            if (prop.value != propValues[i]) {
                allMatch = false;
            }
        });
        return allMatch;
    }

    /**
     * Updates the log property of the given object with the specified log
     * entry (in bullets). This log property must be of the type HTML. The log
     * entry is added to the beginning of the log history. The log layout (i.e,
     * the layout of the HTML table) can be specified too. If the log history
     * exceeds the maximum number of entries, the oldest entries are removed.
     *
     * @param {Object} obj - The object for which the log property should be
     * 	 updated.
     * @param {Object} execArgs - Specifies arguments needed to update the
     *   object (see description of 'execArgs' in the function '_setProps').
     * @param {Object} logBullets - The log message (in bullets) to be added.
     *   Its attribute keys must match the keys of the log template. For the
     *   default log template, the keys are "action" and "message".
     * @param {String} logPropId - The ID of the log property in the docLink.
     * @param {String} storeId - The ID of the store where the log entries are
     *   saved.
     * @param {Object} [logTemplate=null] - The template for the log entries.
     *   If not given, the default template is used.
     * @param {Number} [maxEntries=10] - The maximum number of log entries.
     */
    function _updateLogProp(
        obj, execArgs, logBullets, logPropId, storeId, logTemplate,
        maxEntries, timestampFormat) {
        // Load current log property
        let logProp = obj.properties.find(
                objProp => objProp.key == logPropId);
        if (!logProp) {
            let message =
                "Log-property with ID " + logPropId + " not found in object " +
                obj.id + ".";
            _log(_debuggingMode ? 1 : 0, "error", "'_setProps'", message);
            return;
        }
        // Create new entry
        let currentUser = _getCurrentUser();
        let logEntry = {
            "user": currentUser ?
            (currentUser.resourceName || currentUser.userName) :
            "Unknown User",
            "timestamp": moment().format(
                timestampFormat || "YYYY-MM-DD HH:mm:ss"),
            "processingInfo": logBullets
        };
        // Load log history
        let logHistory = store.load(storeId);
        if (Array.isArray(logHistory)) {
            logHistory.unshift(logEntry); // add entry to beginning of array
        } else {
            logHistory = [logEntry]; // create new array with first entry
        }
        // Save log history
        store.save(storeId, logHistory);
        // Convert log history to HTML
        let logHtml = "<ul>" + json2html.transform(
                logHistory.length > maxEntries ?
                logHistory.slice(0, maxEntries - logHistory.length) : logHistory,
                logTemplate || JSON2HTML_LOG_TEMPLATE) + "</ul>";
        // Update the docLink with the new log
        _setProps(obj, execArgs, [logPropId], [logHtml]);
        return obj;
    }

    /**
     * Constructs JTF column definitions for the configured properties of the
     * given object type. 
     * 
     * @param {String} objType - The object type for which the property columns
     *   should be constructed.
     * @param {String} catId - The JTF category ID which is assigned to all
     *   constructed columns.
     * @returns {Array} - An array of column definition objects for the JTF.
     */
    function _constructPropCols(objType, catId) {
        let propertyDefs_thisObjType = _getSimpleCacheData("propertyDefs", { "objType": objType });
        let propCols = propertyDefs_thisObjType.reduce((acc, propDef) => {
            switch (propDef.constraint.basetype) {
                // Skip purely layouting properties
                case "layout.placeholder":
                case "layout.space":
                case "layout.group":
                case "layout.tab":
                case "layout.line":
                    break;
                // Handled basetypes
                case "string":
                case "enum":
                case "multienum":
                    acc.push({
                        "id": "prop_" + propDef.id + "_col",
                        "catid": catId,
                        "type": propDef.constraint.basetype,
                        "label": propDef.label,
                        "options": { width: 100 }
                    });
                    break;
                default:
                    _log(1, "warn", "2C5661C35F99435C8E83502C62B1D48C", "Basetype '" + propDef.constraint.basetype + "' not yet handled in function _constructPropertyCols.");
            }
            return acc;
        }, []);
        return propCols;
    }

    /**
     * Gets (i.e., maps) the property values of the given object to a format 
     * suitable for JTFs. The returned values correspond to the column 
     * definitions constructed in the function '_constructPropCols'.
     * 
     * @param {Object} obj - The object for which the property values should be
     *   retrieved.
     * @returns {Array} - An array of property values corresponding to the 
     *   column definitions constructed in the function '_constructPropCols'.
     */
    function _getPropValues(obj) {
        let propertyDefs_thisObjType = _getSimpleCacheData("propertyDefs", { "objType": obj.type });
        let propValues = propertyDefs_thisObjType.reduce((acc, propDef) => {
            switch (propDef.constraint.basetype) {
                // Skip purely layouting properties
                case "layout.placeholder":
                case "layout.space":
                case "layout.group":
                case "layout.tab":
                case "layout.line":
                    break;
                // Handled basetypes
                case "string":
                    acc.push(obj.properties.find(prop => prop.key === propDef.id).value);
                    break;
                case "enum":
                    acc.push(_getEnumValue(obj.properties.find(prop => prop.key === propDef.id), propDef));
                    break;
                case "multienum":
                    // Get the enum IDs, i.e., enum values
                    let values = [];
                    if (obj.properties.find(prop => prop.key === propDef.id).value) {
                        values = obj.properties.find(prop => prop.key === propDef.id).value.split(",");
                        // Get rid of leading and trailing quotes
                        values = values.map(
                            x => x.replace(/^"(.*)"$/, '$1'));
                    }
                    let enums = [];
                    values.forEach(valueId => {
                        enums.push(_getEnumValue({"value": valueId}, propDef));
                    });
                    acc.push(enums);
                    break;
                default:
                    _log(1, "warn", "63A40000F5BC42C4B402E011CDE0412A", "Basetype '" + propDef.constraint.basetype + "' not yet handled in function _getPropertyValues.");
            }
            return acc;
        }, []);
        return propValues;
    }

    /**
     * Gets the enum value (i.e., an object with all required attributes for a
     * JTF cell of type "enum") for the given property object. The function 
     * expects the property object to be of basetype "enum".
     * 
     * @param {Object} propObj - The property object for which the enum value 
     *   should be retrieved. If the propDef is given, the attribute 'key' can
     *   be omitted. 
     * @param {Object} [propDef] - The property definition object for the given
     *   property object. If not given, the function tries to retrieve it via
     *   the property key.
     * @returns {Object} - The enum value object for the given property object.
     */
    function _getEnumValue(propObj, propDef) { 
        if (!propDef) propDef = _exec(Pqf.pf, Pqf.pf.getPropertyDefinition, propObj.key);
        // Check if property has a value
        if (!propObj.value) return null;
        // Parse URL
        let urlString = propDef.constraint.properties.find(obj => obj.key === "sourceurl").value;
        let {dataType, objType, tableId, urlVersion} = _parseEnumUrl(urlString);
        // Define execution properties
        const execProps = {
            'PF': {
                'obj': Pqf.pf,
                'getCorrectFunc': objType => Pqf.pf.getEnumValue,
                'params': [tableId, propObj.value, true]
            },
            'RES': {
                'obj': Pqf.res,
                'getCorrectFunc': objType => Pqf.res.getResource,
                'params': [propObj.value]
            },
            'PM':  {
                'obj': Pqf.pm,
                'getCorrectFunc': function(objType) {
                    switch (objType) {
                        case 'Project':
                            return Pqf.pm.getProject;
                        case 'ProjectPortfolio':
                            return Pqf.pm.getProjectPortfolio;
                        default:
                            _log(1, "warn", "3B4C49DEE7D14E12A4116A31ACA342F0", "Object type '" + objType + "' not yet handled in function '_getEnumValue' for data type 'PM'.");
                    }
                },
                'params': [propObj.value]
            },
            'FCO': {
                'obj': Pqf.fco,
                'getCorrectFunc': function(objType) {
                    switch (objType) {
                        case "CostsType": 
                            return Pqf.fco.getCostsType;
                        case "CostsTypeGroup": 
                            return Pqf.fco.getCostsTypeGroup;
                        case "Currency":
                            return Pqf.fco.getCurrency;
                        default:
                            _log(1, "warn", "47E72834F9F146988DC411AE3A2FDF08", "Object type '" + objType + "' not yet handled in function '_getEnumValue' for data type 'FCO'.");
                    }
                },
                'params': [propObj.value]
            },
            'TDP': {
                'obj': Pqf.tdp,
                'getCorrectFunc': objType => Pqf.tdp.getForeignKeyReference,
                'params': [tableId, propObj.value]
            }
        };
        // Check if the data type is known
        if (!execProps[dataType]) {
            _log(1, "error", "E2D4AA52FBAD4571A38EC9049B7BF188", "Unknown data type for enum property with key " + propDef.id + " in function '_getEnumValue'.");
            return null;
        }
        // Check if the function to get the enum value for the given object type is defined
        if (!execProps[dataType].getCorrectFunc(objType)) {
            _log(1, "error", "8DBE6FFC05D54C5A8319607778A67E3C", "Unknown object type '" + objType + "' for data type '" + dataType + "' in function '_getEnumValue'.");
            return null;
        }
        // Execute function
        let obj = _exec_arr(execProps[dataType].obj, execProps[dataType].getCorrectFunc(objType), execProps[dataType].params);
        return _toEnum(obj);
    }

    function _getEnumValues(propDef) {
        if (!propDef) return null;
        // Parse URL
        let urlString = propDef.constraint.properties.find(obj => obj.key === "sourceurl").value;
        let {dataType, objType, tableId, urlVersion} = _parseEnumUrl(urlString);
        // Define execution properties
        const execProps = {
            'PF': {
                'obj': Pqf.pf,
                'getCorrectFunc': objType => Pqf.pf.getEnumValues,
                'params': [tableId, true]
            },
            'RES': {
                'obj': Pqf.res,
                'getCorrectFunc': objType => Pqf.res.getResources,
                'params': []
            },
            'PM':  {
                'obj': Pqf.pm,
                'getCorrectFunc': function(objType) {
                    switch (objType) {
                        case 'Projects':
                            return Pqf.pm.getProjects;
                        case 'ProjectPortfolios':
                            return Pqf.pm.getProjectPortfolios;
                        default:
                            _log(1, "warn", "AF30E88B6B624284A9D55BDF7F7E1C5C", "Object type '" + objType + "' not yet handled in function '_getEnumValue' for data type 'PM'.");
                    }
                },
                'params': []
            },
            'FCO': {
                'obj': Pqf.fco,
                'getCorrectFunc': function(objType) {
                    switch (objType) {
                        case "CostsTypes": 
                            return Pqf.fco.getCostsTypes;
                        case "CostsTypeGroups": 
                            return Pqf.fco.getCostsTypeGroups;
                        case "Currencies":
                            return Pqf.fco.getCurrencies;
                        default:
                            _log(1, "warn", "196B3D5E88E444C898F3B63B86DFEAD7", "Object type '" + objType + "' not yet handled in function '_getEnumValue' for data type 'FCO'.");
                    }
                },
                'params': []
            },
            'TDP': {
                'obj': Pqf.tdp,
                'getCorrectFunc': objType => Pqf.tdp.getForeignKeyReferences,
                'params': [tableId, true]
            }
        };
        // Check if the data type is known
        if (!execProps[dataType]) {
            _log(1, "error", "3E44B57F417A4F85AEBA8F62D975463A", "Unknown data type for enum property with key " + propDef.id + " in function '_getEnumValues'.");
            return null;
        }
        // Check if the function to get the enum values for the given object type is defined
        if (!execProps[dataType].getCorrectFunc(objType)) {
            _log(1, "error", "8530ED2D3C95408095FCF90060B5A990", "Unknown object type '" + objType + "' for data type '" + dataType + "' in function '_getEnumValues'.");
            return null;
        }
        // Execute function
        let objs = _exec_arr(execProps[dataType].obj, execProps[dataType].getCorrectFunc(objType), execProps[dataType].params);
        return objs.map(obj => _toEnum(obj));
    }

    function _parseEnumUrl(urlString) {
        let url_arr = urlString.split("/");
        let dataType = null;
        let objType = null;
        let tableId = null;
        let urlVersion = url_arr[2];
        if (urlVersion === "V1") {
            dataType = url_arr[1];
            objType = url_arr[3];
            tableId = url_arr[4];
        } else if (urlVersion === "V2") {
            dataType = url_arr[3];
            objType = url_arr[4];
            tableId = url_arr[5];
        }
        return {
            "dataType": dataType,
            "objType": objType,
            "tableId": tableId,
            "urlVersion": urlVersion
        };
    }

    // -------------------------------------------------------------------------
    // Function set for scenarios
    // -------------------------------------------------------------------------

    /**
     * Updates the project scenario with the given template. The scenario is
     * updated with the name and description from the template, the work items
     * are adapted according to the template, and constraints are added
     * according to the template.
     *
     * @param {Object} scenario - The project scenario object to be updated.
     * @param {Object} template - The template object of the following
     *   structure:
     *     {
     *       "name": {
     *         "en": "Name in English", // Default language
     *         ...
     *       },
     *       "description": {
     *         "en": "Description in English", // Default language
     *         ...
     *       },
     *       "beg_ref": "2023-10-01T00:00:00Z", // Reference date for all subsequent tasks
     *       "workItems": {
     *         "name": {
     *           "en": "Work Item Name in English", // Default language - must be unique if constraints are assigned
     *           ...
     *         },
     *         "code": "WI001", // Code of the work item
     *         "description": {
     *           "en": "Work Item Description in English", // Default language
     *           ...
     *         },
     * 	       "iconRef": "icon.png", // Icon reference of the work item
     *         "properties": [...] // Properties of the work item
     *         "phaseType": "PROJECT_PHASE", // PROJECT_MILESTONE, ...
     *         "beg": 0, // Start date in days relative to the beg_ref date
     *         "end": 10, // End date in days relative to the beg_ref date
     *         "color": "7E3F4C575CF3425EAD040EB15020458B" // UUID of the color enum value
     *         "index": 0 // Index of the work item in the scenario - only needed for assignment of constraints
     *       },
     *       "subtasks": [ // Optional, sub-work items of the main work item
     *         { ... }, // Same structure as workItems
     *         ...
     *       ],
     *       "constraints": [ // Optional, constraints for the work items
     *         {
     *           "startIndex": 0, // Index of the work item that is the start of the constraint
     *           "endIndex": 1, // Index of the work item that is the end of the constraint
     *           "maxDistance": null, // Maximum distance in days between start and end work item
     *           "minDistance": 0, // Minimum distance in days between start and end work item
     *           "type": "ProjectMilestoneConstraint" // Type of the constraint - no idea what this is used for
     *         },
     *         ... // More constraints
     *       ]
     *     }
     * @example
     * let scenario = Pqf.pm.getProjectScenario(trigger.objectId);
     * let template =
     * {
     *   "name": {
     *     "en": "● New scenario",
     *     "de": "● Neues Szenario",
     *     "fr": "● Nouveau scénario",
     *     "it": "● Nuovo scenario"
     *   },
     *   "workItems": {
     *     "name": {
     *       "en": "Main task",
     *       "de": "Haupttask",
     *       "fr": "Tâche principale"
     *     },
     *     "phaseType": "PROJECT_PHASE",
     *     "beg": 0,
     *     "end": 140,
     *     "color": "04754AC173C5498AA39CB8A7F1D79A2D",
     *     "index": 0,
     *     "subtasks": [
     *       {
     *         "name": {
     *           "en": "Initiation",
     *           "de": "Initiierung",
     *           "fr": "Initiation"
     *         },
     *         "phaseType": "PROJECT_PHASE",
     *         "beg": 0,
     *         "end": 14,
     *         "color": "F7B0E6CDC04B41AFBD1C5B04B6EBC6E0",
     *         "index": 1,
     *         "subtasks": []
     *       },
     *       {
     *         "name": { "en": "MS 01" },
     *         "phaseType": "PROJECT_MILESTONE",
     *         "beg": 14,
     *         "end": 14,
     *         "color": "BBA00D4162DE495F817ADA81A6EF4A12",
     *         "index": 2,
     *         "subtasks": []
     *       },
     *       {
     *         "name": {
     *           "en": "Planning",
     *           "de": "Planung",
     *           "fr": "Planification"
     *         },
     *         "phaseType": "PROJECT_PHASE",
     *         "beg": 14,
     *         "end": 35,
     *         "color": "D3CDBED8980F4119935D7F48B2B4DFF3",
     *         "index": 3,
     *         "subtasks": []
     *       }
     *     ]
     *   },
     *   "constraints": [
     *     { "startIndex": 1, "endIndex": 2, "maxDistance": null, "minDistance": 0, "type": "ProjectMilestoneConstraint" }
     *   ]
     * };
     * pqfLib.scenario.updateProjectScenario(scenario, template);
     */
    function _updateProjectScenario(scenario, template) {
        // Apply template name and description
        scenario.name = template.name ?
            _translate(template.name) : scenario.name;
        scenario.description = template.description ?
            _translate(template.description) : scenario.description;
        _exec(Pqf.pm, Pqf.pm.putProjectScenario, scenario.id, scenario);
        // Adapt scenario work items according to the template
        _updateScenarioWorkItems(
            scenario.id, template.workItems, template.beg_ref);
        // Add constraints
        _addConstraintsToScenario(
            scenario.id, template.workItems, template.constraints);
    }

    /**
     * Updates the scenario work items with the given template.
     *
     * @param {String} scenarioId - The ID of the scenario to be updated.
     * @param {Object} workItems_template - The template for the work items.
     *   It has the same structure as the "workItems" attribute in the
     *   template of the function '_updateProjectScenario'.
     * @param {String} [beg_ref=null] - The reference date for the work items.
     *   If not given, the current date is used as the reference date.
     * @example
     * let scenarioId = "D3CDBED8980F4119935D7F48B2B4DFF3";
     * let workItems_template = { ... }; // See description of the function '_updateProjectScenario'
     * pqfLib.scenario.updateScenarioWorkItems(scenarioId, workItems_template);
     */
    function _updateScenarioWorkItems(scenarioId, workItems_template, beg_ref) {
        // Get the main task of the currenct scenario
        let main_old = _exec(Pqf.pm, Pqf.pm.getScenarioWorkItems, scenarioId);
        if (!main_old) {
            let message = "Main task of scenario " + scenarioId + " not found.";
            _log(_debuggingMode ? 1 : 0, "error", "'_adaptScenarioWorkItems'",
                message);
            return;
        }
        // Update the main task
        beg_ref = beg_ref || moment().toISOString();
        _updateWorkItem(
            main_old[0], workItems_template, beg_ref, "putWorkItem");
        // Recursively add sub-work items
        function _addSubWorkItems(workItem_root, workItems_template) {
            if (!workItems_template.subtasks)
                return;
            workItems_template.subtasks.forEach(subtask_template => {
                // Add new sub-work item
                let subWorkItem = {
                    "projectId": workItem_root.projectId,
                    "scenarioId": workItem_root.scenarioId,
                    "parentPhaseId": workItem_root.id
                };
                subWorkItem = _updateWorkItem(
                        subWorkItem, subtask_template, workItem_root.beg,
                        "addWorkItemSubWorkItem");
                // Do recursive call for sub-sub-work items
                _addSubWorkItems(subWorkItem, subtask_template);
            });
        }
        _addSubWorkItems(main_old[0], workItems_template);
    }

    /**
     * Updates the given work item according to the template.
     *
     * @param {Object} workItem - The work item to be updated. If this object
     *   has been constructed (instead of loaded from the system), it must
     *   contain the following attributes:
     *     {
     *       "projectId": "string", // ID of the project
     *       "scenarioId": "string", // ID of the scenario
     *       "parentPhaseId": "string", // ID of the parent phase (if any)
     *     }
     * @param {Object} workItem_template - The template for the work item. It
     *   has the same structure as the "workItems" attribute in the
     *   template of the function '_updateProjectScenario'.
     * @param {String} beg_ref - The reference date for the work item. This
     *   date is used to calculate the start and end dates of the work item
     *   relative to the reference date.
     * @param {String} mode - The mode of the update. Possible values are:
     *   - "putWorkItem": The given work item already exists and should be
     *     updated.
     *   - "addWorkItemSubWorkItem": The given work item is a sub-work item
     *     and should be added to the parent work item - a new work item
     *     is created! Its attribute "id" is therefore overwritten.
     * @returns {Object} - The updated work item object.
     * @example
     * let workItem = {
     *   "projectId": "D3CDBED8980F4119935D7F48B2B4DFF3",
     *   "scenarioId": "2A1414659EB94151B5A343E65508C7A2",
     *   "parentPhaseId": "D9C2ABB068AD4D719FD9C4868BBC22FD",
     * }
     * let workItem_template = { ... }; // See description of the function '_updateProjectScenario'
     * let beg_ref = "2023-10-01T00:00:00Z"; // Reference date for the work item
     * let updatedWorkItem = pqfLib.scenario.updateWorkItem(workItem, workItem_template, beg_ref, "putWorkItem");
     */
    function _updateWorkItem(workItem, workItem_template, beg_ref, mode) {
        // Adapt object according to the template
        workItem.name = workItem_template.name ?
            _translate(workItem_template.name) : workItem.name;
        workItem.code = workItem_template.code || workItem.code;
        workItem.description = workItem_template.description ?
            _translate(workItem_template.description) : workItem.description;
        workItem.iconRef = workItem_template.iconRef || workItem.iconRef;
        workItem.properties =
            workItem_template.properties || workItem.properties;
        workItem.phaseType = workItem_template.phaseType || workItem.phaseType;
        workItem.beg = workItem_template.beg || workItem_template.beg == 0 ? (
                moment(beg_ref).add(workItem_template.beg, "day").toISOString()) : workItem.beg;
        workItem.end = workItem_template.end ? (
                moment(beg_ref).add(workItem_template.end, "day").toISOString()) : workItem.end;
        workItem.color = workItem_template.color || workItem.color;
        // Update the work item
        if (mode == "putWorkItem") {
            _exec(Pqf.pm, Pqf.pm.putWorkItem, workItem.id, workItem);
        } else if (mode == "addWorkItemSubWorkItem") {
            _exec(
                Pqf.pm, Pqf.pm.addWorkItemSubWorkItem, workItem.parentPhaseId,
                workItem);
        }
        return workItem;
    }

    /**
     * Adds constraints to the scenario according to the template.
     *
     * @param {String} scenarioId - The ID of the scenario to which the
     *   constraints should be added.
     * @param {Object} workItems_template - The template for the work items.
     *   It has the same structure as the "workItems" attribute in the
     *   template of the function '_updateProjectScenario'.
     * @param {Array} constraints - The constraints to be added. It has the
     *   same structure as the "constraints" attribute in the
     *   template of the function '_updateProjectScenario'.
     * @example
     * let scenarioId = "D3CDBED8980F4119935D7F48B2B4DFF3";
     * let workItems_template = { ... }; // See description of the function '_updateProjectScenario'
     * let constraints = [ ... ]; // See description of the function '_updateProjectScenario'
     * pqfLib.scenario.addConstraintsToScenario(scenarioId, workItems_template, constraints);
     */
    function _addConstraintsToScenario(
        scenarioId, workItems_template, constraints) {
        // Load all work items of the scenario
        let workItems = _exec(
                Pqf.pm, Pqf.pm.getScenarioWorkItems, scenarioId, true);
        if (!workItems) {
            let message =
                "Work items of scenario " + scenarioId + " not found.";
            _log(_debuggingMode ? 1 : 0, "error", "'_addConstraintsToScenario'",
                message);
            return;
        }
        // Map work items to template indices
        let indexMap = {};
        function _mapIndexToStartAndEndId(root_template) {
            if (!root_template.name) {
                let message =
                    "Function _addConstraintsToScenario can only handle " +
                    " templates where all work items have a name specified.";
                _log(_debuggingMode ? 1 : 0, "error",
                    "'_addConstraintsToScenario'", message);
                return;
            }
            let root_name = _translate(root_template.name);
            let root_workItem = workItems.find(
                    item => item.name == root_name);
            if (!root_workItem) {
                let message =
                    "Work item with name " + root_name + " not found in " +
                    "scenario " + scenarioId + ".";
                _log(_debuggingMode ? 1 : 0, "error",
                    "'_addConstraintsToScenario'", message);
                return;
            }
            indexMap[root_template.index] = {
                "startId": root_workItem.startId,
                "endId": root_workItem.endId
            };
            // Do recursive call for sub-work items
            if (root_template.subtasks) {
                let anyFailed = false;
                root_template.subtasks.forEach(subtask_template => {
                    if (!_mapIndexToStartAndEndId(subtask_template)) {
                        anyFailed = true;
                    }
                });
                if (anyFailed)
                    return;
            }
            return true;
        }
        _mapIndexToStartAndEndId(workItems_template);
        // Add constraints
        constraints.forEach(constraint => {
            let predecessorMilestoneId = indexMap[constraint.startIndex] ?
                indexMap[constraint.startIndex].endId : null;
            let successorMilestoneId = indexMap[constraint.endIndex] ?
                indexMap[constraint.endIndex].startId : null;
            if (!predecessorMilestoneId || !successorMilestoneId) {
                let message =
                    "Constraint " + constraint.type + " from index " +
                    constraint.startIndex + " to index " + constraint.endIndex +
                    " cannot be added because one of the work items is not " +
                    "found in scenario " + scenarioId + ".";
                _log(_debuggingMode ? 1 : 0, "error",
                    "'_addConstraintsToScenario'", message);
                return;
            }
            let obj = {
                "id": Pqf.clf.newUuids(1).newUuids[0],
                "maxDistance": constraint.maxDistance,
                "minDistance": constraint.minDistance,
                "predecessorMilestoneId": predecessorMilestoneId,
                "successorMilestoneId": successorMilestoneId,
                "type": constraint.type,
                "constraintType": "MANUAL"
            };
            _exec(
                Pqf.pm, Pqf.pm.putProjectConstraint, scenarioId, obj.id, false,
                obj);
        });
    }

    /**
     * Returns the IDs of all subportfolios (recursively) of a given portfolio.
     *
     * @param {String} portfolioId - The ID of a portfolio.
     * @returns {Array} - IDs (String) of all subportfolios (recursive)
     */
    function _getSubPortfolioIds(portfolioId) {
        let portfolioIds = [portfolioId];
        let subportfolios = Pqf.pm.getProjectPortfolioSubPortfolios(portfolioId).map(pf => pf.id);
        if (subportfolios) {
            subportfolios.forEach(function (subpf) {
                portfolioIds = portfolioIds.concat(_getSubPortfolioIds(subpf));
            });
        }
        return portfolioIds;
    }

    /**
     * Returns the projects of a given portfolio (recursively, i.e., includes
     * the projects of all subportfolios).
     *
     * @param {String} portfolioId - The ID of a portfolio.
     * @returns {Array} - Projects (Object) of the portfolio and its
     * subportfolios. Same project structure as returned by the PQF API
     * Pqf.pm.getProjects.
     */
    function _getProjectsRecursively(portfolioId) {
        let projects = Pqf.pm.getProjectPortfolioProjects(reference.id);
        let subportfolioIds = _getSubPortfolioIds(portfolioId);
        subportfolioIds.forEach(function (subpfId) {
            projects = projects.concat(Pqf.pm.getProjectPortfolioProjects(subpfId));
        });
        // Remove duplicate projects
        projects = _.uniqBy(projects, function (p) {
            return p.id;
        });
        return projects;
    }

    // -------------------------------------------------------------------------
    // Caching functions
    // -------------------------------------------------------------------------

    function _cacheGetProjects(pull) {
        pull = (typeof pull == "undefined" ? false : true);
        let key = _MD5("pm.getProjects()");
        if (!pull) {
            let content = _cacheLoad(key);
            if (content && content.object)
                return content.object;
        }
        _log(_debuggingMode > 0 ? 1 : 0, "log", null,
            "PULLING projects <-- server");
        let projects = Pqf.pm.getProjects();
        _cacheSave(key, projects);
        return projects;
    }

    function _cachePullProjects() {
        return _cacheGetProjects(true);
    }

    function _cacheGetProject(projectId, pull) {
        pull = (typeof pull == "undefined" ? false : true);
        let key = _MD5("pm.getProject(" + projectId + ")");
        if (!pull) {
            let content = _cacheLoad(key);
            if (content && content.object)
                return content.object;
        }
        _log(_debuggingMode > 0 ? 1 : 0, "log", null,
            "PULLING project " + projectId + " <-- server");
        let project = Pqf.pm.getProject(projectId);
        _cacheSave(key, project);
        _log(_debuggingMode > 1 ? 1 : 0, "log", null,
            "project: " + JSON.stringify(project));
        return project;
    }

    function _cachePullProject(projectId) {
        return _cacheGetProject(projectId, true);
    }

    function _cacheGetProjectSubObj(projectId, subobjectType, pull) {
        pull = (typeof pull == "undefined" ? false : true);
        let key = _MD5("pm.getProjectSubObj(" + projectId + ","
                 + subobjectType + ")");
        if (!pull) {
            let content = _cacheLoad(key);
            if (content && content.object)
                return content.object;
        }
        _log(_debuggingMode > 0 ? 1 : 0, "log", null,
            "PULLING project subobject " + projectId + " <-- server");
        let subobject = Pqf.pm.getProjectSubObj(projectId, subobjectType);
        _log(_debuggingMode > 1 ? 1 : 0, "log", null,
            "project subobject: " + JSON.stringify(subobject));
        _cacheSave(key, subobject);
        return subobject;
    }

    function _cachePullProjectSubObj(projectId, subobjectType) {
        return _cacheGetProjectSubObj(projectId, subobjectType, true);
    }

    function _cachePutProjectSubObj(projectId, subobjectType, subobject) {
        let key = _MD5("pm.getProjectSubObj(" + projectId + ","
                 + subobjectType + ")");
        _log(_debuggingMode > 1 ? 1 : 0, "log", null,
            "CACHING project subobject: " + projectId);
        _log(_debuggingMode > 1 ? 1 : 0, "log", null,
            "project subobject: " + JSON.stringify(subobject));
        _cacheSave(key, subobject);
    }

    function _cachePushProjectSubObj(projectId, subobjectType) {
        let key = _MD5("pm.getProjectSubObj(" + projectId + ","
                 + subobjectType + ")");
        let current = _cacheLoad(key);
        if (current.hasChanged && current.object) {
            _log(_debuggingMode > 0 ? 1 : 0, "log", null,
                "PUSHING project subobject " + projectId + " --> server");
            _log(_debuggingMode > 1 ? 1 : 0, "log", null,
                "project subobject: " + JSON.stringify(current.object));
            Pqf.pm.putProjectSubObj(projectId, subobjectType, current.object);
            _cacheReconcile(key);
        }
    }

    function _cacheClear() {
        store.list().forEach(x => store.save(x, null));
    }

    // ---------------------------------
    // Internal cache functions
    // ---------------------------------

    function _cacheLoad(key) {
        return store.load(key);
    }

    function _cacheSave(key, object) {
        let doSave = false;
        let current = _cacheLoad(key);
        if (current) {
            let currentHash = _MD5(JSON.stringify(current.object));
            let newHash = _MD5(JSON.stringify(object));
            if (newHash != currentHash) {
                doSave = true;
            }
        } else {
            doSave = true;
        }
        if (doSave)
            store.save(key, {
                "object": object,
                "hasChanged": true
            });
    }

    function _cacheReconcile(key) {
        let current = _cacheLoad(key);
        current.hasChanged = false;
        store.save(key, current);
    }

    /**
     * Import a project and its related data (scenario, work items, constraints)
     * into a target portfolio. Assigns new IDs, checks for existing entities,
     * and updates references as needed. If a project with the same ID already
     * exists, the returned data will show that. A new project will nevertheless be created.
     *
     * @param {Object} projectData - The project data to import (as obtained from _exportProjectData, see there)
     * @param {Object} projectData.project - The project object.
     * @param {Object} projectData.scenario - The project’s active scenario object.
     * @param {Object[]} projectData.workItems - Array of work item objects.
     * @param {Object[]} projectData.constraints - Array of work item constraint objects.
     * @param {string} importPortfolioId - The ID of the target portfolio for import.
     * @returns {Object} Import result object.
     * @returns {Object|null} return.project - The imported project (with new ID).
     * @returns {Object|null} return.scenario - The imported scenario (with new ID).
     * @returns {Object[]|null} return.workItems - Imported work items with new IDs and updated references.
     * @returns {Object[]|null} return.constraints - Imported constraints with updated milestone references.
     *
     * @example
     * // First export data from an existing project
     * const exportedData = _exportProjectData("project456");
     * // Then import it into another portfolio
     * const imported = _importProjectData(exportedData, "portfolio123");
     * console.log(imported.project.id); // New project ID
     * console.log(imported.project.exists); // true if project already existed
     */
    function _importProjectData(projectData, importPortfolioId) {
        let project = projectData.project;
        let scenario = projectData.scenario;
        let workItems = projectData.workItems;
        let constraints = projectData.constraints;

        let result = {
            "project": null,
            "scenario": null,
            "workItems": null,
            "constraints": null
        };

        // Try to import project

        let existingProject = null;
        try {
            existingProject = Pqf.pm.getProject(project.id);
        } catch (err) {
            _log(_debuggingMode, "log", null, "Project " + project.id + " does not yet exist.");
        }

        project.code = null;
        project.id = Pqf.clf.newUuids(1).newUuids[0];
        project.portfolios = [{
                "id": importPortfolioId,
                "type": "ProjectPortfolio"
            }
        ];

        let success = false;
        try {
            Pqf.pm.putProject(project.id, project);
            success = true;
        } catch (err) {
            _log(1, "error", "C3643A101B274DA1851CA0DC78A62377", err);
        }
        if (success) {
            if (existingProject) {
                project.exists = true;
            }
            result.project = project;

            // Try to import scenario

            let existingScenario = null;
            try {
                existingScenario = Pqf.pm.getProjectScenario(scenario.id);
            } catch (err) {
                _log(_debuggingMode, "log", null, "Scenario " + scenario.id + " does not yet exist.");
            }

            scenario.id = Pqf.clf.newUuids(1).newUuids[0];
            scenario.projectId = project.id;

            success = false;
            try {
                Pqf.pm.putProjectScenario(scenario.id, scenario);
                success = true;
            } catch (err) {
                _log(1, "error", "E623B222240A4179952169F0D2BAC765", err);
            }
            if (success) {
                if (existingScenario) {
                    scenario.exists = true;
                }
                result.scenario = scenario;

                // Try to import work items
                let mainTask = Pqf.pm.getScenarioWorkItems(scenario.id, false)[0];
                let idMap = [];

                // Put work items
                workItems.forEach(function (workItem) {

                    if (workItem.parentPhaseId) {
                        // Insert child task
                        let mappingFound = idMap.find(x => x.old == workItem.parentPhaseId);
                        workItem.parentPhaseId = mappingFound ? mappingFound.new : null;

                        let newWorkItemRef = null;
                        try {
                            newWorkItemRef = Pqf.pm.addWorkItemSubWorkItem(workItem.parentPhaseId, workItem);
                        } catch (err) {
                            _log(1, "error", "6FB6325223DB41D78E64EC550161EE10", err);
                        }
                        idMap.push({
                            "old": workItem.id,
                            "new": newWorkItemRef?.id
                        });
                        let newWorkItem = null;
                        try {
                            newWorkItem = Pqf.pm.getWorkItem(newWorkItemRef.id);
                        } catch (err) {
                            _log(1, "error", "31BFF81F619F4168988C5FF6804709F6", err);
                        }
                        idMap.push({
                            "old": workItem.startId,
                            "new": newWorkItem?.startId
                        });
                        idMap.push({
                            "old": workItem.endId,
                            "new": newWorkItem?.endId
                        });
                    } else {
                        // Update main task
                        mainTask.name = workItem.name;
                        mainTask.beg = workItem.beg;
                        mainTask.end = workItem.end;
                        try {
                            Pqf.pm.putWorkItem(mainTask.id, false, mainTask);
                        } catch (err) {
                            _log(1, "error", "1BEC00D71583451F8D8364F56413EB4D", err);
                        }
                        idMap.push({
                            "old": workItem.id,
                            "new": mainTask.id
                        });
                        idMap.push({
                            "old": mainTask.startId,
                            "new": mainTask.startId
                        });
                        idMap.push({
                            "old": mainTask.endId,
                            "new": mainTask.endId
                        });
                    }

                });
                result.workItems = workItems;

                // Put constraints
                constraints.forEach(function (constraint) {
                    constraint.id = Pqf.clf.newUuids(1).newUuids[0];
                    let mappingFound = idMap.find(x => x.old == constraint.predecessorMilestoneId);
                    constraint.predecessorMilestoneId = mappingFound ? mappingFound.new : null;
                    mappingFound = idMap.find(x => x.old == constraint.successorMilestoneId);
                    constraint.successorMilestoneId = mappingFound ? mappingFound.new : null;
                    try {
                        Pqf.pm.putProjectConstraint(scenario.id, constraint.id, constraint);
                    } catch (err) {
                        _log(1, "error", "EB6DB7C0255E4AAEB3ECF89CE6A11EB5", err);
                    }
                });
                result.constraints = constraints;

            }
        }
        return result;
    }

    /**
     * Export detailed JSON data for a given project, including its active scenario,
     * associated work items, and work item constraints.
     *
     * @param {string} projectId - The ID of the project to export.
     * @param {Object} [omitAtts_perObjType] - Optional object specifying attributes to omit for each object type. The keys are object types (e.g., "project", "scenario", "workItem", "constraint") and the values are arrays of attribute names to omit for that type.
     * @returns {Object} Project data object.
     * @returns {Object|null} return.project - The project object.
     * @returns {Object|null} return.scenario - The active scenario object.
     * @returns {Object[]|null} return.workItems - Array of work item objects.
     * @returns {Object[]|null} return.constraints - Array of work item constraint objects.
     *
     * @example
     * const projectData = _exportProjectData("project456");
     * console.log(projectData.project.name);
     */
    function _exportProjectData(projectId, omitAtts_perObjType) {
        let project = null;
        let subObjects = null;
        let scenario = null;
        let workItems = null;
        let constraints = null;
        try {
            project = Pqf.pm.getProject(projectId);
            subObjects = Pqf.pm.getProjectSubObjs(projectId);
            scenario = Pqf.pm.getProjectActiveScenario(project.id, true);
            workItems = Pqf.pm.getScenarioWorkItems(scenario.id, true);
            constraints = Pqf.pm.getProjectConstraints(scenario.id);
        } catch (err) {}
        let jsdata = {
            "project": project,
            "subObjects": subObjects,
            "scenario": scenario,
            "workItems": workItems,
            "constraints": constraints
        };
        if (omitAtts_perObjType) {
            Object.keys(omitAtts_perObjType).forEach(function (objType) {
                if (jsdata[objType]) {
                    if (Array.isArray(jsdata[objType])) {
                        console.log("Array of objects: " + jsdata[objType].length);
                        jsdata[objType].forEach(function (obj) {
                            omitAtts_perObjType[objType].forEach(function (att) {
                                obj[att] = null;
                            });
                        });
                    } else {
                        omitAtts_perObjType[objType].forEach(function (att) {
                            jsdata[objType][att] = null;
                        });
                    }
                }
            });
        };
		return jsdata;
    }

    /**
     * Export all project data as JSON for a given portfolio.
     *
     * @param {string} portfolioId - The ID of the portfolio to export projects from.
     * @param {Object} [omitAtts_perObjType] - Optional object specifying attributes to omit for each object type. The keys are object types (e.g., "project", "scenario", "workItem", "constraint") and the values are arrays of attribute names to omit for that type. This parameter is passed to the function _exportProjectData for each project.
     * @returns {Object[]} Array of project data objects (see function _exportProjectData).
     *
     * @example
     * const data = _exportPortfolioData("portfolio123");
     * console.log(data);
     */
    function _exportPortfolioData(portfolioId, omitAtts_perObjType) {
        let projects = [];
        try {
            projects = Pqf.pm.getProjectPortfolioProjects(portfolioId);
        } catch (err) {}
        return projects.map(function (project) {
            return _exportProjectData(project.id, omitAtts_perObjType);
        });
    }

    return {
        /**
         * Enable or disable debugging mode globally.
         * @function
         * @param {boolean} enabled - Whether to enable debugging mode.
         */
        setDebuggingMode: _setDebuggingMode,

        /**
         * Enable or disable mocking mode for API calls.
         * @function
         * @param {boolean} enabled - Whether to enable mocking mode.
         */
        setMockingMode: _setMockingMode,

        utils: {
            language: {
                /**
                 * Translate a key to the current user language.
                 * @function
                 * @param {string} key - The key to translate.
                 * @param {Object<string,string>} [replacements] - Optional placeholders to replace in the string.
                 * @returns {string} Translated string.
                 */
                translate: _translate,

                /**
                 * Get the current user's language code.
                 * @function
                 * @returns {string} Language code (e.g., 'en').
                 */
                getUserLanguage: _getUserLanguage
            },

            format: {
                /**
                 * Convert a value into a number.
                 * @function
                 * @param {string|number} value - Value to convert.
                 * @returns {number} Parsed number.
                 */
                makeNumber: _makeNumber,

                /**
                 * Format a number with ' as thousands separator.
                 * @function
                 * @param {number} number - Number to format.
                 * @param {number} [decimals=0] - Number of decimal places.
                 * @param {string} [thousandsSeparator="'"] - Thousands separator.
                 * @param {string} [decimalSeparator="."] - Decimal separator.
                 * @returns {string} Formatted number string.
                 */
                printNumber: _printNumber,

                /**
                 * Round a number to the specified precision.
                 * @function
                 * @param {number} value - Number to round.
                 * @param {number} [decimals=0] - Number of decimal places.
                 * @returns {number} Rounded number.
                 */
                round: _round,

                /**
                 * Strip HTML tags from a string.
                 * @function
                 * @param {string} html - String containing HTML.
                 * @returns {string} Cleaned string without HTML.
                 */
                stripHtml: _stripHtml,

                /**
                 * Sanitize a string to prevent XSS.
                 * @function
                 * @param {string} input - Raw input string.
                 * @returns {string} Sanitized string.
                 */
                sanitizeString: _sanitizeString,

                /**
                 * Clean a string from HTML in a property context.
                 * @function
                 * @param {string} value - Input string.
                 * @returns {string} Cleaned string.
                 */
                cleanHtmlProperty: _cleanHtmlProperty,

                /**
                 * Escape RegExp special characters in a string.
                 * @function
                 * @param {string} str - Input string.
                 * @returns {string} Escaped string.
                 */
                escapeRegExp: _escapeRegExp,

                /**
                 * Replace all occurrences of a substring.
                 * @function
                 * @param {string} str - Original string.
                 * @param {string|RegExp} search - Search string or regex.
                 * @param {string} replace - Replacement string.
                 * @returns {string} Updated string.
                 */
                replaceAll: _replaceAll,

                /**
                 * Encode a string for safe storage or transmission.
                 * @function
                 * @param {string} str - String to encode.
                 * @returns {string} Encoded string.
                 */
                encode: _encode,

                /**
                 * Decode an encoded string.
                 * @function
                 * @param {string} str - Encoded string.
                 * @returns {string} Decoded string.
                 */
                decode: _decode,

                /**
                 * Decode a string or return null if invalid.
                 * @function
                 * @param {string} str - Encoded string.
                 * @returns {string|null} Decoded string or null.
                 */
                decodeOrNull: _decodeOrNull,

                /**
                 * Convert duration in hours to a Moment.js duration object.
                 * @function
                 * @param {number} hours - Duration in hours.
                 * @returns {Object} Moment.js duration object.
                 */
                durationInHoursToMoment: _durationInHoursToMoment,

                /**
                 * Check whether a value is an integer.
                 * @function
                 * @param {number} value - Input value.
                 * @returns {boolean} True if integer.
                 */
                isInteger: _isInteger,
				
                /**
                 * Convert a string to an array of integers.
                 * @function
                 * @param {string} str - Input string.
				 * @param {separator} [separator=","] - Separation character
                 * @returns {Array<number>} Array of integers.
                 */
				toArrayOfIntegers: _toArrayOfIntegers
            },

            datetime: {
                /**
                 * Get the current time string.
                 * @function
                 * @returns {string} Current time in HH:mm format.
                 */
                getTime: _getTime,

                /**
                 * Get the current date string.
                 * @function
                 * @returns {string} Current date in YYYY-MM-DD format.
                 */
                getDate: _getDate,

                /**
                 * Get the current hour.
                 * @function
                 * @returns {number} Hour (0–23).
                 */
                currentHour: _currentHour,

                /**
                 * Get the current day.
                 * @function
                 * @returns {number} Day of the month.
                 */
                currentDay: _currentDay,

                /**
                 * Get a human-readable description of a period.
                 * @function
                 * @param {Object} period - Period object.
                 * @returns {string} Human-readable string.
                 */
                getPeriodHumanReadable: _getPeriodHumanReadable
            },

            misc: {
                /**
                 * Compare two raw text values for equality.
                 * @function
                 * @param {string} a - First string.
                 * @param {string} b - Second string.
                 * @returns {boolean} True if equal.
                 */
                checkRawTextEqual: _checkRawTextEqual,

                /**
                 * Get a property value from an object or null if missing.
                 * @function
                 * @param {Object} obj - Target object.
                 * @param {string} prop - Property name.
                 * @returns {*} Property value or null.
                 */
                getPropertyValueOrNull: _getPropertyValueOrNull,

                /**
                 * Check if a property has changed in an object.
                 * @function
                 * @param {Object} obj - Target object.
                 * @param {string} prop - Property name.
                 * @param {*} newValue - New value.
                 * @returns {boolean} True if changed.
                 */
                checkPropertyChanged: _checkPropertyChanged,

                /**
                 * Execute a function only once.
                 * @function
                 * @param {Function} fn - Function to execute.
                 */
                execOnce: _execOnce,

                /**
                 * Execute a function once per object.
                 * @function
                 * @param {Object} obj - Object to associate.
                 * @param {Function} fn - Function to execute.
                 */
                execOncePerObject: _execOncePerObject,

                /**
                 * Get the current user's name.
                 * @function
                 * @returns {string} User name.
                 */
                getCurrentUserName: _getCurrentUserName,

                /**
                 * Parse URL components from a string.
                 * @function
                 * @param {string} url - URL string.
                 * @returns {Object} Components.
                 */
                getUrlComponents: _getUrlComponents,

                /**
                 * Get the tenant alias.
                 * @function
                 * @returns {string} Tenant alias.
                 */
                getTenantAlias: _getTenantAlias,

                /**
                 * Get the tenant URL.
                 * @function
                 * @returns {string} Tenant URL.
                 */
                getTenantUrl: _getTenantUrl,

                /**
                 * Get the remaining JavaScript quota for the current session.
                 * @function
                 * @returns {number} Remaining quota.
                 */
                getRemainingJsQuota: _getRemainingJsQuota,

                /**
                 * Log a message for debugging or auditing.
                 * @function
                 * @param {...*} args - Arguments to log.
                 */
                log: _log,

                /**
                 * Calculate MD5 hash of input.
                 * @function
                 * @param {string} str - Input string.
                 * @returns {string} MD5 hash.
                 */
                MD5: _MD5,

                /**
                 * Convert a value to a defined enum type.
                 * @function
                 * @param {*} value - Input value.
                 * @param {Object} enumObj - Enum mapping.
                 * @returns {*} Enum value.
                 */
                toEnum: _toEnum,
                
                /**
                 * Map a currency ID to the currency code.
                 * 
                 * @param {String} currencyId - The ID of the currency.
                 * @returns {String} - The code of the currency.
                 * @example
                 * let currencyCode = pqfDataCollectorLib.tools.mapCurrency(currencyId);
                 * currencyCode;
                 * // returns
                 * "EUR"
                 */
                mapCurrency: _mapCurrency
            },

            apiFunc: {
                /**
                 * Execute an API function.
                 * @async
                 * @function
                 * @param {string} name - API function name.
                 * @param {Object} params - Parameters.
                 * @returns {Promise<*>} API response.
                 */
                exec: _exec,

                /**
                 * Execute multiple API functions in batch.
                 * @async
                 * @function
                 * @param {Array<Object>} requests - API request objects.
                 * @returns {Promise<Array>} API responses.
                 */
                exec_arr: _exec_arr
            }
        },

        portfolios: {
            /**
             * Get all sub-portfolio IDs.
             * @function
             * @param {string} portfolioId
             * @returns {Array<string>} Sub-portfolio IDs.
             */
            getSubPortfolioIds: _getSubPortfolioIds,

            /**
             * Export portfolio data.
             * @function
             * @param {string} portfolioId
             * @returns {Object} Exported data.
             */
            exportPortfolioData: _exportPortfolioData
        },

        projects: {
            /**
             * Recursively get all projects under a portfolio.
             * @function
             * @param {string} portfolioId
             * @returns {Array<Object>} Projects list.
             */
            getProjectsRecursively: _getProjectsRecursively,

            /**
             * Set indicator selection for a project.
             * @function
             */
            setIndicatorSelection: _setIndicatorSelection,

            /**
             * Alternative indicator selection setter.
             * @function
             */
            setIndicatorSelection2: _setIndicatorSelection2,

            /**
             * Transfer property values between projects.
             * @function
             */
            transferPropertyValues: _transferPropertyValues,

            /**
             * Export project data.
             * @function
             */
            exportProjectData: _exportProjectData,

            /**
             * Import project data.
             * @function
             */
            importProjectData: _importProjectData
        },

        resources: {
            /**
             * Get current user resource object.
             * @function
             */
            getCurrentUser: _getCurrentUser,

            /**
             * Get a user by resource object.
             * @function
             */
            getUserWithResource: _getUserWithResource,

            /**
             * Get users from resource IDs.
             * @function
             */
            getUsersFromResourceIds: _getUsersFromResourceIds,

            /**
             * Get users from role ID.
             * @function
             */
            getUsersFromRoleId: _getUsersFromRoleId,

            /**
             * Get users from relation type ID.
             * @function
             */
            getUsersFromRelationTypeId: _getUsersFromRelationTypeId,

            /**
             * Get resources from relation type ID.
             * @function
             */
            getResourcesFromRelationTypeId: _getResourcesFromRelationTypeId,

            /**
             * Automatically approve a resource.
             * @function
             */
            autoApprove: _autoApprove
        },

        reports: {
            /**
             * Generate resource statistics report.
             * @function
             * @param {Object} params - Parameters for the report.
             * @returns {Object} Report data.
             */
            resourceStatistics: _resourceStatistics,

            /**
             * Get the latest report for a portfolio or project.
             * @function
             * @param {string} entityId - Portfolio or project ID.
             * @returns {Object} Latest report data.
             */
            getLatestReport: _getLatestReport,

            /**
             * Create a portfolio snapshot report.
             * @function
             * @param {string} portfolioId - Portfolio ID.
             * @returns {Object} Snapshot data.
             */
            portfolioSnapshot: _portfolioSnapshot,

            /**
             * Get resource efforts within a given period.
             * @function
             * @param {Object} period - Period specification.
             * @returns {Array} Effort entries.
             */
            resourceEffortsInPeriod: _resourceEffortsInPeriod,

            /**
             * Maintenance function to create zero effort bookings.
             * @function
             */
            maintenanceZeroEffortBooking: _maintenanceZeroEffortBooking,

            /**
             * @deprecated Use createReportNotification2 instead.
             * @function
             */
            createReportNotification: _createReportNotification,

            /**
             * Create a report notification.
             * @function
             */
            createReportNotification2: _createReportNotification2,

            /**
             * Create HTML table for a report.
             * @function
             */
            createReportTableHtml: _createReportTableHtml,

            /**
             * Create and save a report.
             * @function
             */
            createAndSave: _createAndSave
        },

        mail: {
            /**
             * Send a report email.
             * @function
             */
            sendReport: _sendReportMail,

            /**
             * Send a custom HTML email.
             * @function
             */
            sendHtmlMail: _sendHtmlMail,

            /**
             * Send a simple notification email.
             * @function
             */
            sendSimpleNotification: _sendSimpleNotificationMail,

            /**
             * @deprecated Use sendNotification3 instead.
             * @function
             */
            sendNotification: _sendNotificationMail,

            /**
             * @deprecated Use sendNotification3 instead.
             * @function
             */
            sendNotification2: _sendNotificationMail2,

            /**
             * Send a notification email (current method).
             * @function
             */
            sendNotification3: _sendNotificationMail3,

            /**
             * Send lifecycle decision notification email.
             * @function
             */
            sendLifecycleDecisionNotification: _sendLifecycleDecisionNotificationMail,

            /**
             * Send lifecycle comment notification email.
             * @function
             */
            sendLifecycleCommentNotification: _sendLifecycleCommentNotificationMail,

            /**
             * Send error alert email.
             * @function
             */
            sendErrorAlert: _sendErrorAlert,

            /**
             * Set template parameters for emails.
             * @function
             */
            setTemplateParams: _setMailTemplateParams,

            /**
             * Get a mail template HTML.
             * @function
             */
            getHtmlTemplate: _getHtmlTemplate,

            /**
             * Get mail message template HTML.
             * @function
             */
            getHtmlMessageTemplate: _getHtmlMessageTemplate,

            /**
             * Get HTML vertical separator for emails.
             * @function
             */
            getHtmlVerticalSeparator: _getHtmlVerticalSeparator,

            /**
             * Get HTML horizontal separator for emails.
             * @function
             */
            getHtmlHorizontalLine: _getHtmlHorizontalLine,

            /**
             * Validate an email address.
             * @function
             * @param {string} email
             * @returns {boolean} True if valid.
             */
            validateEmail: _validateEmail
        },

        docLink: {
            /**
             * Create a document link with a document.
             * @function
             */
            createDocLinkWithDocument: _createDocLinkWithDocument,

            /**
             * Get a document link object.
             * @function
             */
            get: _getDocLink,

            /**
             * Get the document from a link.
             * @function
             */
            getDocument: _getDocument,

            /**
             * Update a linked document.
             * @function
             */
            updateDoc: _updateDocLinkDocument,

            /**
             * Get attachment ID from URL.
             * @function
             * @param {string} url
             * @returns {string} Attachment ID.
             */
            getAttachmentIdFromUrl: _getAttachmentIdFromUrl,

            /**
             * Get attachment name from URL.
             * @function
             * @param {string} url
             * @returns {string} Attachment name.
             */
            getAttachmentNameFromUrl: _getAttachmentNameFromUrl,

            /**
             * Replace attachment ID in URL.
             * @function
             */
            replaceAttachmentIdInUrl: _replaceAttachmentIdInUrl
        },

        properties: {
            /**
             * Set multiple properties on an object.
             * @function
             */
            setProps: _setProps,

            /**
             * Check properties for validity or change.
             * @function
             */
            checkProps: _checkProps,

            /**
             * Update log property for auditing.
             * @function
             */
            updateLogProp: _updateLogProp,

            /**
             * Constructs the JTF column definitions for the given object type.
             * @function
             */
            constructPropCols: _constructPropCols,

            /**
             * Get property values (for JTF cells) for a given object.
             * @function
             */
            getPropValues: _getPropValues,

            /**
             * Get enum value for a given property object.
             * @function
             */
            getEnumValue: _getEnumValue,

            /**
             * Get all enum values for a given property object.
             * @function
             */
            getEnumValues: _getEnumValues
        },

        scenario: {
            /**
             * Update project scenario.
             * @function
             */
            updateProjectScenario: _updateProjectScenario,

            /**
             * Update scenario work items.
             * @function
             */
            updateScenarioWorkItems: _updateScenarioWorkItems,

            /**
             * Update a single work item.
             * @function
             */
            updateWorkItem: _updateWorkItem,

            /**
             * Add constraints to a scenario.
             * @function
             */
            addConstraintsToScenario: _addConstraintsToScenario
        },

        lifecycle: {
            /**
             * Add a comment in the lifecycle.
             * @function
             */
            putComment: _putComment,

            /**
             * Transfer properties on lifecycle change.
             * @function
             */
            transferProperties: _transferPropertiesOnLifecycleChange
        },

        cache: {
            pm: {
                /**
                 * Get cached projects.
                 * @function
                 */
                getProjects: _cacheGetProjects,

                /**
                 * Pull projects from the server and cache them.
                 * @function
                 */
                pullProjects: _cachePullProjects,

                /**
                 * Get a single cached project.
                 * @function
                 */
                getProject: _cacheGetProject,

                /**
                 * Pull a single project from the server.
                 * @function
                 */
                pullProject: _cachePullProject,

                /**
                 * Get a sub-object from a cached project.
                 * @function
                 */
                getProjectSubObj: _cacheGetProjectSubObj,

                /**
                 * Store a sub-object in a cached project.
                 * @function
                 */
                putProjectSubObj: _cachePutProjectSubObj,

                /**
                 * Pull a sub-object from the server for a project.
                 * @function
                 */
                pullProjectSubObj: _cachePullProjectSubObj,

                /**
                 * Push a sub-object into a cached project.
                 * @function
                 */
                pushProjectSubObj: _cachePushProjectSubObj
            },

            main: {
                /**
                 * Clear the main cache.
                 * @function
                 */
                clear: _cacheClear
            }
        }
    };

})();
