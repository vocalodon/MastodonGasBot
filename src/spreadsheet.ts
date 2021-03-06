import { strict } from "assert";
import { networkInterfaces } from "os";
import { ConfigData } from "./sheetData";

export function logUsers() {
    getOnlineUsers();
    const sheet = SpreadsheetApp.getActive().getSheetByName("current users");
    const logSheet = SpreadsheetApp.getActive().getSheetByName("user log");
    const log = logSheet.getDataRange().getValues().slice(1);
    const onlineUsers = sheet.getDataRange().getValues().slice(1).reverse();
    function update(log: any[]) {
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

export function isTriggerEnable() {
    const propertySheet = SpreadsheetApp.getActive().getSheetByName("bot property");
    const botLogSheet = SpreadsheetApp.getActive().getSheetByName("bot log");
    const botLog = botLogSheet.getDataRange().getValues().slice(1);

    const lastDateRow = botLog[botLog.length - 1];
    if (!lastDateRow) {
        return true;
    };

    let configData = new ConfigData("bot property");
    configData.readData();
    let configs = configData.configs();

    const holdFire = configs[0]["hold fire"];
    if ((typeof holdFire !== "boolean") || holdFire) return false;

    const lastDateStr = botLog[botLog.length - 1][0];
    const lastDate = new Date(lastDateStr);

    const holdTime = configs[0]["hold time"];
    if (!(holdTime instanceof Date)) {
        return false;
    }
    const epoch = new Date("Dec 30 1899 00:00:00");
    const holdTimeMiliSec = holdTime.valueOf() - epoch.valueOf();
    const delta = Date.now().valueOf() - lastDate.valueOf();

    const isTriggerEnable = delta > holdTimeMiliSec;
    return isTriggerEnable;
}

export function foundNewUser() {
    const logSheet = SpreadsheetApp.getActive().getSheetByName("user log");
    const log = logSheet.getDataRange().getValues().slice(1);
    for (let index in log) {
        if (log[index][5]) {
            return true;
        }
    };
    return false;
}

export function getOnlineUsers() {
    const sheet = SpreadsheetApp.getActive().getSheetByName("current users");

    const statusies = get_local_timeline();
    const table = statusies.map(
        (status) => [status.account.acct, status.account.display_name, toJST(status.created_at)]
    );

    const range = sheet.getRange(2, 1, statusies.length, table[0].length);
    range.setValues(table);
}

export function updateTable(dateStr: string, tableStr: string) {
    const date = new Date(dateStr);
    const hours = date.getHours() % 24;
    const table = tableStr ? JSON.parse(tableStr) : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    table[hours] += 1;
    return JSON.stringify(table);
}

export function getBotMessage(): { status: string, spoiler_text: string } {
    const propertySheet = SpreadsheetApp.getActive().getSheetByName("bot property");
    const messageSheet = SpreadsheetApp.getActive().getSheetByName("bot message");
    const messageLines = messageSheet.getDataRange().getValues().slice(1);
    const messageBack = messageSheet.getDataRange().getBackgrounds().slice(1);

    let payload = { status: "", spoiler_text: "" };
    let spoilerText = "";
    let status = "";
    for (let index in messageLines) {
        let current = messageLines[index][1] + "\n";
        if (messageBack[index][1] === "#ffffff") {
            payload["status"] += current;
        } else {
            payload["spoiler_text"] += current;
        }
    };

    return payload;
}

export function setProcessedDate() {
    const botLogSheet = SpreadsheetApp.getActive().getSheetByName("bot log");
    const lastRow = botLogSheet.getLastRow();
    const range = botLogSheet.getRange(lastRow + 1, 1);
    const nowStr = toJST(new Date().toISOString());
    range.setValue(nowStr);
}

