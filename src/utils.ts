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

function toJST(dateStr) {
    let date = new Date(dateStr);
    return Utilities.formatDate(date, "JST", "yyyy-MM-dd") + "T" + Utilities.formatDate(date, "JST", "HH:mm:ssZ");
}