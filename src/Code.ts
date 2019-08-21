function postBotMessage() {
    logUsers();
    if (isTriggerEnable() && foundNewUser()) {
        let message = getBotMessage();
        statuses_new_status(message);
        setProcessedDate();
    }
}