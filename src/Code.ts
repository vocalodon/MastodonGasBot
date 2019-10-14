import { logUsers, isTriggerEnable, foundNewUser, getBotMessage, setProcessedDate } from "./spreadsheet";

function postBotMessage() {
    logUsers();
    if (isTriggerEnable() && foundNewUser()) {
        let payload = getBotMessage();
        statuses_new_status(payload);
        setProcessedDate();
    }
}