// completely isolated from popup and user page
// complete access of chrome apis
// alone it can't access , modify the DOM property of page, but together with content_script
// they can do whichever is possible, content_script accesses the DOM prop of page and send the mssg to background.js, then with the help of chrome apis , it can modify the DOM prop and send back again to content_scripts

//set all keys in the storage when installed
const durKey = "dur";
const flagKey = "flags";
const todosKey = "todos";
const alarmsKey = "alarms";
const settingsKey = "settings";
const bookmarksKey = "bookmarks";
const available_ids = "available_ids";
const max__rule__id = "max__rule__id";
const rules = "rules";

// const notesKey = "notes";
var extensionId = "";
//get extension id
chrome.management.getSelf()
    .then(extensionInfo => {
        // console.log(extensionInfo);
        if(extensionInfo.name === "PROMAN extension"){
            extensionId = extensionInfo.id;
        }

        //1: do nothing
        //2: block
        //3: unblock
        chrome.runtime.onInstalled.addListener((details)=>{
            if(details.reason == 'install'){
                console.log('extension installed');
                chrome.storage.sync.set({ 
                    [flagKey]: {'block': 1, rule__id: 0, 'surfTime': false } ,
                    [bookmarksKey]: { } ,
                    [alarmsKey]: { } ,
                    [durKey]: {  } ,
                    [settingsKey]: { 'alarmAlert': false, 'breakAlert': false, 'todoAlert': false } ,
                    [todosKey]: [ ],
                    [available_ids]: [ ],
                    [max__rule__id]: 0,
                    [rules]: [ ],
                });
            }
        });
    }).catch(err => {
        console.log(err);
    });

function block_request(changes) {  
    const block = changes["flags"]["newValue"].block;
    const newRuleId = changes["flags"]["newValue"].rule__id;
    if(block === 2){
        // console.log("blocking");
        // block the request recently inserted in rules array 
        const newUrlFilter = changes["rules"]["newValue"].slice(-1)[0].urlFilter;
        chrome.declarativeNetRequest.updateDynamicRules({
            // options
            addRules: [{
                "id": newRuleId,
                "priority": 1,
                "action": { "type": "block" },
                "condition": {
                    "urlFilter": newUrlFilter,
                    "resourceTypes": [
                        'csp_report', 'font', 'image', 'main_frame', 'media', 'object', 'other', 'ping', 'script',
                        'stylesheet', 'sub_frame', 'webbundle', 'websocket', 'webtransport', 'xmlhttprequest'
                    ]
                }
            }]
        }).then(()=>{
            // console.log("blocked");
        }).catch(err=>{
            console.log(err);
        });
    }else if(block === 3){
        // console.log("unblocking");
        // unblock the request with given id(changes[flags].rule_id)
        chrome.declarativeNetRequest.updateDynamicRules({
            // options
            removeRuleIds: [newRuleId]
        }).then(()=>{
            // console.log("unblocked");
        }).catch(err=>{
            console.log(err);
        });
    }else{
        console.log("error occurred in blocking");
        return;
    }
}

chrome.storage.onChanged.addListener((changes, area)=>{
    if( area == 'sync' && changes.rules?.newValue ){
        // console.log(changes["flags"]);
        block_request(changes);
    }
});

// unblock_browser
chrome.runtime.onMessage.addListener((request, sender, sendResponse)=>{
    if(request.query === "unblock_browser"){
        chrome.declarativeNetRequest.updateDynamicRules({
            addRules: [
                {
                    "id": 4000,
                    "priority": 1,
                    "action": { "type": "allowAllRequests" },
                    "condition": {
                        "urlFilter": "*://*/*",
                        "resourceTypes": [
                            'main_frame', 'sub_frame'
                        ]
                    }
                }
            ],
            removeRuleIds: [4000]
        }).then(()=>{
            chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: [4000]
            });
        }).catch(err=>{
            console.log(err);
        });         
    }
});

//alarm management =========================================================
// chrome.alarms api
chrome.runtime.onMessage.addListener(function (request,sender,sendResponse) { 
    if(request.purpose == 'set'){
        var alarmInfo = {};
        if(!isNaN(request.period)){
            alarmInfo = {
                when: Date.now() + request.msInterval,
                periodInMinutes: request.period, 
            };
        }else{
            alarmInfo = {
                when: Date.now() + request.msInterval,
            };
        }
        //create an alarm based on request
        chrome.alarms.create(request.alarmName, alarmInfo);
        sendResponse({'status': request.alarmName+' alarm is successfully set'});
    }
});

//onAlarm event 
chrome.alarms.onAlarm.addListener(function (alarm) { 
    //alarm notification details=====================
    const now = new Date();
    const alarmTitle = alarm.name + ' ALERT!!!';
    const alarmMsg = 'Dear folk\nthe time is ' + now.toLocaleTimeString() + ' and it is basic reminder for '+ alarm.name;
    const alarmoptions = {
        type: 'basic',
        title: alarmTitle,
        message: alarmMsg,
        iconUrl: '/icons/alarm-clock.png',
        eventTime: 5000
    };

    chrome.notifications.create('alarm', alarmoptions, (notificationId)=>{}); 
    //alarm notification end==============================
    
    chrome.storage.sync.get(null)
        .then(items => {
            //check if alarm period is once
            if(isNaN(alarm['periodInMinutes'])){//if yes
                //remove from the object value of "alarms" key
                var alarmsValue = items[alarmsKey];//get the "alarms" value object
                //delete the key.value pair
                delete(alarmsValue[alarm.name]);
                //set object back again
                chrome.storage.sync.set( { [alarmsKey]: alarmsValue })
                    .then(()=>{
                        chrome.runtime.sendMessage({'name': alarm.name, 'purpose': 'removeOneTime'});
                    }).catch(err => {
                        // console.log("one time alarm removed from storage.");
                        console.log(err);
                    });
            }
        }).catch(err => {
            console.log(err);
        });
});

//clear the alarm requested
//listen the request to remove the alarm
chrome.runtime.onMessage.addListener(function (request,sender,sendResponse) { 
    //remove the alarm by using its name
    if(request.purpose == 'remove'){
        chrome.alarms.clear(request.name)
            .then(wasCleared => {
                if(wasCleared === true){
                    sendResponse({'status': request.name+' alarm is successfully removed'});
                }else{
                    console.log("requested alarm is not cleared");
                }
            }).catch(err => {
                console.log(err);
            });
    }
});


//browsing time management ============================================================================
//notification details===========================
const breakTitle = 'BREAK TIME ALERT!!!'
const breakMsg = 'Dear folk\nIt is break time and all sites are blocked. Take some rest now.';

const breakoptions = {
    type: 'image',
    title: breakTitle,
    message: breakMsg,
    iconUrl: '/images/logo1.png',
    imageUrl: '/images/notimage.jpeg',
    requireInteraction: true
  };
//notification details end=====================

// Audio is not supported in MV3

//set a timer which will keep track of browsing time
var startDate = new Date();
var elapsedTime = 0;
setInterval(()=>{
    elapsedTime = Math.round((new Date() - startDate)/1000);
    //check for break time 
    var check = 0;
    if(target_for_break == elapsedTime){
        target_for_break = -1;
        check = 1;

        //console.log('breakover======================');
        //block all urls on break
        chrome.declarativeNetRequest.updateDynamicRules({
            addRules: [{
              'id': 4000,
              'priority': 1,
              'action': {
                'type': 'block'
              },
              'condition': {
                'urlFilter': '*://*/*',
                'resourceTypes': [
                  'csp_report', 'font', 'image', 'main_frame', 'media', 'object', 'other', 'ping', 'script',
                  'stylesheet', 'sub_frame', 'webbundle', 'websocket', 'webtransport', 'xmlhttprequest'
                ]
              }
            }],
           removeRuleIds: [4000]
        }).then(()=>{
            chrome.runtime.sendMessage({'purpose': 'breakover'})
            .then(response => {
                // console.log(response);
            }).catch(err => {
                console.log(err);
            });
        }).catch(err=>{
            console.log(err);
        });
    }

    chrome.storage.sync.get(null, (items)=>{
        //block all urls if check is true ===========================================
        if(check){
            chrome.notifications.create('break', breakoptions, (notificationId)=>{});      
            var f = items[flagKey];
            f['surfTime'] = true;
            chrome.storage.sync.set({[flagKey]: f });
        }

        //todo management ===========================================================
        var todos = items[todosKey];
        var statusChanged = 0;
        if(todos){
            todos.forEach( i => {
                var start = new Date(i['start']);
                var end = new Date(i['end']);
                var now = new Date();
                //default status is 'todo'
                if(now.toLocaleString() == start.toLocaleString()){
                    i['status'] = 'ongoing';
                    statusChanged = 1;
    
                    const todoMsg = 'Hey your scheduled task ' + i['title'] + ' has started now.';
                    const todoOptions = {
                        type: 'image',
                        title: i['title'] + ' task reminder',
                        message: todoMsg,
                        iconUrl: '/images/logo1.png',
                        imageUrl: '/images/todo.png',
                        requireInteraction: true
                    };
                    chrome.notifications.create('todo', todoOptions, (notificationId)=>{});
                }
                if(now.toLocaleString() === end.toLocaleString()){
                    i['status'] = 'done'; 
                    statusChanged = 1;
                }
                if(statusChanged === 1){
                    chrome.storage.sync.set({[todosKey]: todos});
                    statusChanged = 0;
                } 
            });
        }
    });
},1000);

// as soon as popup is open, send them the elapsed browsing time
chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
    if(request.popup == 'open'){
        sendResponse({'elapsedTime': elapsedTime, 'purpose': 'spent'});
    }
});
//break time management=========================================================================

//block all urls if break is over===============================================================
var target_for_break = -1;
chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
    if(request.purpose == 'break'){
        var curr = elapsedTime;//seconds
        var dur = request.duration;//seconds
        target_for_break = curr + dur;
    }
});

// clean up the whole data, if user uninstalls the extension
// chrome.runtime.setUninstallURL("")
//     .then(()=>{
//         chrome.storage.sync.get("max__rule__id")
//             .then(items=>{
//                 chrome.declarativeNetRequest.updateDynamicRules(
                    
//                 )
//             })
        
//     })

// chrome.declarativeNetRequest.getDynamicRules()
// .then(rules=>{
//     console.log(rules);
// })

function getLocation(href) {  
    var loc = document.createElement('a');
    loc.href = href;
    return loc;
}


