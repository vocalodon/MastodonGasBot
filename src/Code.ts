interface OAuth2 {
    getRedirectUri(scriptID: string): string[];
}
declare var OAuth2: OAuth2;

const url = "https://vocalodon.net";

const scriptID = ScriptApp.getScriptId();
let auth = {
    "client_name": "dongas_bot",
    "redirect_uris": OAuth2.getRedirectUri(scriptID),
    "scopes": "read write",
}

function apps() {

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        "method": "post",
        "payload": auth,
    };
    let apiUrl = concatUrl(url, "/api/v1/apps");
    let response = UrlFetchApp.fetch(apiUrl, options);
    let secrets = JSON.parse(response.getContentText());
    return secrets;
}

function getSecrets() {
    let secrets = apps();
    let scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperties(secrets);
}

function doGet(request: any) {
    let service = getService();
    if (!service.hasAccess()) {
        let authorizationUrl = service.getAuthorizationUrl();
        let template = HtmlService.createTemplate("<a href='<?= authorizationUrl ?>' target='_blank'>Authorize</a>.");
        //template.authorizationUrl = authorizationUrl;
        let page = template.evaluate();
        return HtmlService.createHtmlOutput(page);
    } else {
        return HtmlService.createHtmlOutput("OK");
    };
}

function getService() {
    let scriptProperties = PropertiesService.getScriptProperties();
    let secrets = scriptProperties.getProperties();
    let authUrl = concatUrl(secrets.url, "/oauth/authorize");
    let tokenUrl = concatUrl(secrets.url, "/oauth/token");
    return OAuth2.createService(secrets.name)
        .setAuthorizationBaseUrl(authUrl)
        .setTokenUrl(tokenUrl)
        .setClientId(secrets.client_id)
        .setClientSecret(secrets.client_secret)
        .setCallbackFunction("authCallback")
        .setPropertyStore(PropertiesService.getScriptProperties())
        .setScope("read write");
}

let authCallback = function (request: any) {
    let service = getService();
    let isAuthorized = service.handleCallback(request);
    if (isAuthorized) {
        return HtmlService.createHtmlOutput("Success!");
    } else {
        return HtmlService.createHtmlOutput("Denied.");
    };
}

function reset() {
    let service = getService();
    service.reset();
}

function timelines(what, params) {
    let service = getService();
    let accessToken = service.getAccessToken();
    let url = PropertiesService.getScriptProperties().getProperty("url");
    if (url === null)
        throw new Error("PropertiesService returns null");
    url = url.toString();
    let headers = { "Authorization": "Bearer " + accessToken };
    let options = {
        "method": "get",
        "headers": headers,
    };
    url = concatUrl(url, "/api/v1/timelines");
    url = concatUrl(url, what);
    let paramsStr = "";
    for (let key in params) {
        if (!paramsStr) {
            paramsStr = "?";
        } else {
            paramsStr += "&";
        }
        if (params[key]) {
            paramsStr += key + "=" + params[key];
        } else {
            paramsStr += key;
        };
    }
    url += paramsStr;
    let response = UrlFetchApp.fetch(url);
    let statuses = JSON.parse(response.getContentText());
    return statuses;
}

function statuses_new_status(status) {
    let service = getService();
    let accessToken = service.getAccessToken();
    let url: string = PropertiesService.getScriptProperties().getProperty("url");
    let headers = { "Authorization": "Bearer " + accessToken };
    let options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        "method": "post",
        "headers": headers,
        "payload": { "status": status },
    };
    let apiUrl = concatUrl(url, "/api/v1/statuses");
    let response = UrlFetchApp.fetch(apiUrl, options);
    let statuses = JSON.parse(response.getContentText());
    return statuses;
}


function get_local_timeline() {
    let params = {
        "local": "true",
        "limit": 40,
    };
    return timelines("public", params);
}

function concatUrl(pre: string, post: string) {
    if (pre.substr(pre.length - 1) != "/") {
        pre = pre + "/";
    };
    if (post.substr(0, 1) == "/") {
        post = post.substr(1, post.length - 1);
    };
    let url = pre + post;
    return url;
}


function getOnlineUsers() {
    let sheet = SpreadsheetApp.getActive().getSheetByName("current users");

    let statusies = get_local_timeline();
    let table: string[] = [];
    for (let index in statusies) {
        let status = statusies[index];
        table[index] = [status.account.acct, status.account.display_name, toJST(status.created_at)];
    };
    let range = sheet.getRange(2, 1, statusies.length, table[0].length);
    range.setValues(table);
}


function toJST(dateStr) {
    let date = new Date(dateStr);
    return Utilities.formatDate(date, "JST", "yyyy-MM-dd") + "T" + Utilities.formatDate(date, "JST", "HH:mm:ssZ");
}

function logUsers() {
    getOnlineUsers();
    let sheet = SpreadsheetApp.getActive().getSheetByName("current users");
    let logSheet = SpreadsheetApp.getActive().getSheetByName("user log");
    let log = logSheet.getDataRange().getValues().slice(1);
    let onlineUsers = sheet.getDataRange().getValues().slice(1).reverse();
    function update(log) {
        logSheet.getRange(2, 1, log.length, log[0].length).setValues(log);
    };

    for (let lIndex in log) {
        log[lIndex][5] = "FALSE";
    };

    for (let uIndex in onlineUsers) {
        let onlineUser = onlineUsers[uIndex];
        let isNewEntry = true;
        for (let lIndex in log) {
            let logUser = log[lIndex];
            if (onlineUser[0] == logUser[0]) {
                if (logUser[3] < onlineUser[2]) {
                    logUser[1] = onlineUser[1]
                    logUser[2] += 1;
                    logUser[3] = onlineUser[2];
                    logUser[4] = updateTable(onlineUser[2], logUser[4]);
                };
                isNewEntry = false;
                break;
            };
        };
        if (isNewEntry) {
            let newData = [onlineUser[0], onlineUser[1], 1, onlineUser[2], updateTable(onlineUser[2], ""), "TRUE"];
            log.push(newData);
            update(log);
        };
    };
    update(log);
}

function updateTable(dateStr, tableStr) {
    let date = new Date(dateStr);
    let hours = date.getHours() % 24;
    let table = tableStr ? JSON.parse(tableStr) : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    table[hours] += 1;
    return JSON.stringify(table);
}

function getBotMessage() {
    let propertySheet = SpreadsheetApp.getActive().getSheetByName("bot property");
    let messageSheet = SpreadsheetApp.getActive().getSheetByName("bot message");
    let messageLines = messageSheet.getDataRange().getValues().slice(1);
    let greetingTable = propertySheet.getRange(2, 1, 24, 2).getValues();
    let greetingMap = {};
    for (let index in greetingTable) {
        greetingMap[greetingTable[index][0]] = greetingTable[index][1];
    };

    let greeting = greetingMap[(new Date()).getHours()];
    let message = "";
    for (let index in messageLines) {
        message += messageLines[index][1] + "\n";
    };
    message = greeting + "\n" + message;
    return message;
}

function foundNewUser() {
    let logSheet = SpreadsheetApp.getActive().getSheetByName("user log");
    let log = logSheet.getDataRange().getValues().slice(1);
    for (index in log) {
        if (log[index][5]) {
            return true;
        }
    };
    return false;
}

function isTriggerEnable() {
    let propertySheet = SpreadsheetApp.getActive().getSheetByName("bot property");
    let botLogSheet = SpreadsheetApp.getActive().getSheetByName("bot log");
    let botLog = botLogSheet.getDataRange().getValues().slice(1);

    let lastDateRow = botLog[botLog.length - 1];
    if (!lastDateRow) {
        return true;
    };
    let lastDateStr = botLog[botLog.length - 1][0];
    let lastDate = new Date(lastDateStr);
    let now = new Date();
    let holdTime = propertySheet.getRange(1, 4, 2, 1).getValues()[1][0];
    let epoch = new Date("Dec 30 1899 00:00:00");
    let holdTimeMiliSec = holdTime - epoch;
    let delta = now - lastDate;

    let isTriggerEnable = delta > holdTimeMiliSec;
    return isTriggerEnable;
}

function setProcessedDate() {
    let botLogSheet = SpreadsheetApp.getActive().getSheetByName("bot log");
    let lastRow = botLogSheet.getLastRow();
    let range = botLogSheet.getRange(lastRow + 1, 1);
    let now = new Date();
    let nowStr = toJST(now.toISOString());
    range.setValue(nowStr);
}

function postBotMessage() {
    logUsers();
    if (isTriggerEnable() && foundNewUser()) {
        let message = getBotMessage();
        statuses_new_status(message);
        setProcessedDate();
    }
}