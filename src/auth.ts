declare let OAuth2: OAuth2;
const url = "https://vocalodon.net";
const scriptID = ScriptApp.getScriptId();

let auth = {
    "client_name": "dongas_bot",
    "redirect_uris": OAuth2.getRedirectUri(scriptID),
    "scopes": "read write",
}

interface OAuth2 {
    getRedirectUri(scriptID: string): string[];
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