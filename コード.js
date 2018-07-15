var url = 'https://vocalodon.net';
var scriptProperties = PropertiesService.getScriptProperties();
if( !scriptProperties.getProperty('url') )
{
  scriptProperties.setProperty('url', url)
};

var scriptID = ScriptApp.getScriptId();
var auth = {
  'client_name': 'dongas_bot',
  'redirect_uris': OAuth2.getRedirectUri(scriptID),
  'scopes': 'read write',
};

function apps() {
  var options = {
    'method': 'post',
    'payload': auth,
  };
  var apiUrl = concatUrl(url, '/api/v1/apps');
  var response = UrlFetchApp.fetch(apiUrl, options);
  var secrets = JSON.parse(response.getContentText());
  return secrets;
};

function getSecrets() {
  var secrets = apps();
  var scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperties(secrets);
};

function doGet(request) {
  var service = getService();
  if (!service.hasAccess()) {
    var authorizationUrl = service.getAuthorizationUrl();
    var template = HtmlService.createTemplate('<a href="<?= authorizationUrl ?>" target="_blank">Authorize</a>.');
    template.authorizationUrl = authorizationUrl;
    var page = template.evaluate();
    return HtmlService.createHtmlOutput(page);
  } else {
    return HtmlService.createHtmlOutput('OK');
  };
};

function getService() {
  var scriptProperties = PropertiesService.getScriptProperties();
  var secrets = scriptProperties.getProperties();
  var authUrl = concatUrl( secrets.url, "/oauth/authorize");
  var tokenUrl = concatUrl( secrets.url, "/oauth/token");
  return OAuth2.createService( secrets.name ) 
  .setAuthorizationBaseUrl( authUrl )
  .setTokenUrl(tokenUrl)
  .setClientId(secrets.client_id)
  .setClientSecret(secrets.client_secret)
  .setCallbackFunction('authCallback')
  .setPropertyStore(PropertiesService.getScriptProperties())
  .setScope('read write');
};

var authCallback = function(request) {
  var service = getService();
  var isAuthorized = service.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success!');
  } else {
    return HtmlService.createHtmlOutput('Denied.');
  };
};

function reset() {
  var service = getService();
  service.reset();
}

function timelines(what, params) {
  var service = getService();
  var accessToken = service.getAccessToken();
  var url = PropertiesService.getScriptProperties().getProperty('url');
  var headers = {'Authorization' : 'Bearer ' + accessToken};  
  var options = {
    'method': 'get',
    'headers': headers,
  };
  url = concatUrl(url, '/api/v1/timelines');
  url = concatUrl(url, what);
  var paramsStr = '';
  for(var key in params) {
    if( params[key] ) {
      paramsStr += '?' + key + '=' + params[key];
    } else {
      paramsStr += '?' + key;
    };
  }
  url += paramsStr;
  var response = UrlFetchApp.fetch(url);
  var statuses = JSON.parse(response.getContentText());
  return statuses;
};

function statuses_new_status(status) {
  var service = getService();
  var accessToken = service.getAccessToken();
  var url = PropertiesService.getScriptProperties().getProperty('url');
  var headers = {'Authorization' : 'Bearer ' + accessToken};  
  var options = {
    'method': 'post',
    'headers': headers,    
    'payload': {'status':status},
  };
  var apiUrl = concatUrl(url, '/api/v1/statuses');
  var response = UrlFetchApp.fetch(apiUrl, options);
  var statuses = JSON.parse(response.getContentText());
  return statuses;
};


function get_local_timeline() {
  var params = {
    'local': 'true',
    'limit': 40,
  };
  return timelines('public',params);
};

function concatUrl(pre, post) {
  if( pre.substr(pre.length-1) != '/' ) {
    pre = pre + '/';
  };
  if( post.substr(0,1) == '/' ) {
    post = post.substr(1, post.length-1);
  };
  var url = pre+post;
  return url;
};


function getOnlineUsers() {
  var sheet =  SpreadsheetApp.getActive().getSheetByName('current users');

  var statusies = get_local_timeline();
  var table = [];
  for(var index in statusies) {
    var status = statusies[index];
    table[index] = [status.account.acct, status.account.display_name, toJST(status.created_at)];
  };
  var range = sheet.getRange(2, 1,statusies.length, table[0].length);
  range.setValues(table);
};


function toJST(dateStr) {
  var date = new Date(dateStr);
  return Utilities.formatDate(date, "JST", "yyyy-MM-dd") + 'T' + Utilities.formatDate(date, "JST", "HH:mm:ssZ");
};

function logUsers() {
  getOnlineUsers();
  var sheet =  SpreadsheetApp.getActive().getSheetByName('current users');
  var logSheet = SpreadsheetApp.getActive().getSheetByName('user log');  
  var log = logSheet.getDataRange().getValues().slice(1);
  var onlineUsers = sheet.getDataRange().getValues().slice(1).reverse();
  function update(log) {
    logSheet.getRange(2,1,log.length,log[0].length).setValues(log);
  };
  
  for(var lIndex in log) {
    log[lIndex][5] = 'FALSE';
  };
  
  for(var uIndex in onlineUsers ) {
    var onlineUser = onlineUsers[uIndex];
    var isNewEntry = true;
    for(var lIndex in log ) {
      var logUser = log[lIndex];
      if(onlineUser[0] == logUser[0] ) {
        if(logUser[3] < onlineUser[2]) {
          logUser[1] = onlineUser[1]
          logUser[2] += 1;
          logUser[3] = onlineUser[2];
          logUser[4] = updateTable( onlineUser[2], logUser[4] );
        };
        isNewEntry = false;
        break;
      };
    };
    if( isNewEntry ) {
      var newData = [onlineUser[0],onlineUser[1],1, onlineUser[2],updateTable(onlineUser[2],""),'TRUE'];
      log.push(newData);
      update(log);
    };
  };
  update(log);
};

function updateTable(dateStr, tableStr) {
  var date = new Date(dateStr);
  var hours = date.getHours() % 24;
  var table = tableStr ? JSON.parse(tableStr):[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; 
  table[hours] += 1;
  return JSON.stringify(table);
};

function getBotMessage() {
  var propertySheet =  SpreadsheetApp.getActive().getSheetByName('bot property');
  var messageSheet =  SpreadsheetApp.getActive().getSheetByName('bot message');
  var messageLines = messageSheet.getDataRange().getValues().slice(1);
  var greetingTable = propertySheet.getRange(2,1,24,2).getValues();
  var greetingMap = {};
  for(var index in greetingTable) {
    greetingMap[greetingTable[index][0]] = greetingTable[index][1];
  };
  
  var greeting = greetingMap[(new Date()).getHours()];
  var message = '';
  for(var index in messageLines ) {
    message += messageLines[index][1] + '\n';
  };
  message = greeting + '\n' + message;
  return message;
};

function foundNewUser() {
  var logSheet = SpreadsheetApp.getActive().getSheetByName('user log');  
  var log = logSheet.getDataRange().getValues().slice(1);
  for(index in log) {
    if( log[index][5] ) {
      return true;
    }
  };
  return false;
};

function isTriggerEnable() {
  var propertySheet =  SpreadsheetApp.getActive().getSheetByName('bot property');
  var botLogSheet =  SpreadsheetApp.getActive().getSheetByName('bot log');
  var botLog = botLogSheet.getDataRange().getValues().slice(1);
  
  if( botLog.length == 0 ){
    return true;
  };
  var lastDateStr = botLog[botLog.length-1][0];
  if(!lastDateStr) {
    return true;
  };
  var lastDate = new Date(lastDateStr);
  var now = new Date();
  var holdTime = propertySheet.getRange(1,4,2,1).getValues()[1][0];
  var epoch = new Date('Dec 30 1899 00:00:00');
  var holdTimeMiliSec = holdTime - epoch;
  var delta = now - lastDate;

  var isTriggerEnable = delta > holdTimeMiliSec;
  return isTriggerEnable;
};

function setProcessedDate() {
  var botLogSheet =  SpreadsheetApp.getActive().getSheetByName('bot log');
  var lastRow = botLogSheet.getLastRow();
  var range = botLogSheet.getRange(lastRow+1,1);
  var now = new Date();
  var nowStr = toJST(now.toISOString());
  range.setValue(nowStr);
};

function postBotMessage() {
  logUsers();
  if( isTriggerEnable() && foundNewUser() ) {
    var message = getBotMessage();
    statuses_new_status(message);
    setProcessedDate();
  }
};