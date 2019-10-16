function get_local_timeline() {
    let params = {
        "local": "true",
        "limit": 40,
    };
    return timelines("public", params);
}

function timelines(what: string, params: { [key: string]: any }): any[] {
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

function getOptions(payload:{status:string, spoiler_text:string}) {
    let service = getService();
    let accessToken = service.getAccessToken();
    let headers = { "Authorization": "Bearer " + accessToken };

    let options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
        "method": "post",
        "headers": headers,
        "payload": payload,
    };

    return options;
}

function getUrl(): string {
    let url = PropertiesService.getScriptProperties().getProperty("url");
    if (url == "") {
        throw new Error("no url property");
    }
    let apiUrl = concatUrl("" + url, "/api/v1/statuses");
    return apiUrl;
}

function statuses_new_status(payload:{status:string, spoiler_text:string}) {
    let apiUrl = getUrl();
    let options = getOptions(payload);
    let response = UrlFetchApp.fetch(apiUrl, options);
    let statuses = JSON.parse(response.getContentText());
    return statuses;
}


