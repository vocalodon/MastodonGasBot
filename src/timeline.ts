function get_local_timeline() {
    const params: { [key: string]: any } = {
        "local": "true",
        "limit": 40,
    };
    let statuses = [];
    let count = 0;
    let maxDate: Date | undefined;
    let rangeTime = (new Date("Jan 01 1970 01:00:00")).valueOf();
    let delta: number;
    do {
        let current = timelines("public", params);
        if (maxDate === undefined) {
            maxDate = new Date(current[0]["created_at"]);
        }
        let minDate = current[current.length - 1]["created_at"];
        delta = maxDate.valueOf() - minDate.valueOf();
        params["max_id"] = current[current.length-1]["id"];
        count += 1;
    } while (count < 10 && delta < rangeTime);
    return timelines("public", params);
}

function getTimelineEndpoint(what: string, params: { [key: string]: any }): string {
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
    return url;
}

function timelines(what: string, params: { [key: string]: any }): { [key: string]: any }[] {
    const url = getTimelineEndpoint(what, params);
    const response = UrlFetchApp.fetch(url);
    const statuses = JSON.parse(response.getContentText());
    return statuses;
}

function getOptions(payload: { status: string, spoiler_text: string }) {
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

function statuses_new_status(payload: { status: string, spoiler_text: string }) {
    let apiUrl = getUrl();
    let options = getOptions(payload);
    let response = UrlFetchApp.fetch(apiUrl, options);
    let statuses = JSON.parse(response.getContentText());
    return statuses;
}


