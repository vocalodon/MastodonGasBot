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

function foundNewUser() {
    let logSheet = SpreadsheetApp.getActive().getSheetByName("user log");
    let log = logSheet.getDataRange().getValues().slice(1);
    for (let index in log) {
        if (log[index][5]) {
            return true;
        }
    };
    return false;
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

function setProcessedDate() {
    let botLogSheet = SpreadsheetApp.getActive().getSheetByName("bot log");
    let lastRow = botLogSheet.getLastRow();
    let range = botLogSheet.getRange(lastRow + 1, 1);
    let now = new Date();
    let nowStr = toJST(now.toISOString());
    range.setValue(nowStr);
}

