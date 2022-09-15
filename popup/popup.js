// this is js file to manage popup of extension
// no access of chrome apis
const body = document.querySelector('body');
const now = document.querySelector(".now");
const optionsButtons = document.querySelectorAll('.go-to-options');
const features_btn = document.querySelector('.feature-btn');
const features_container = document.querySelector('.display-features');
const block_browser = document.querySelector('.block_browser');
const unblock_browser = document.querySelector('.unblock_browser');

setInterval(()=>{
  var curr = new Date();
  var h = curr.getHours(), m = curr.getMinutes(), s = curr.getSeconds();
  if(h < 10)  h = "0"+h;
  if(m < 10)  m = "0"+m;
  if(s < 10)  s = "0"+s;

  now.innerHTML = `<span>${h}</span> <span>${m}</span> <span>${s}</span>`;
}, 1000);

optionsButtons.forEach(btn => {
  btn.addEventListener('click', function() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL(','));
    }
  });
});

//  block_browser 
block_browser.addEventListener("click", e=>{
  chrome.runtime.sendMessage({query: "block_browser"});
});
//  unblock_browser
unblock_browser.addEventListener("click", e=>{
  chrome.runtime.sendMessage({query: "unblock_browser"});
});

// alarm management=========================================================
const alarmForm = document.querySelector('.alarm-form');
const alarmTableBody = document.querySelector('.alarms-table-body');
// break time management====================================================
const breakTime  = document.querySelector('.break-time');
var bdf = document.querySelector('#bdf');// break duration form

// first load alarms============================================
function loadAlarms() {  
  // alarmTableBody.innerHTML = '';
  chrome.storage.sync.get('alarms')
    .then(items=>{
      if(items){
        var alarmsObj = items['alarms'];
        if(alarmsObj){
          var alarmsKey = Object.keys(alarmsObj);
          alarmsKey.forEach((i)=>{
            if(!isNaN(alarmsObj[i].period)){
              const template = `<tr>
                                  <td><i class="far fa-bell"></i></td>
                                  <td><b>${i}</b></td>
                                  <td>${alarmsObj[i].time}</td>
                                  <td>${alarmsObj[i].period} min</td>
                                  <td><button class="remove my-btn">remove</button></td>
                               </tr>`;
              alarmTableBody.innerHTML += template;
            }else{
              const template = `<tr>
                                  <td><i class="far fa-bell"></i></td>
                                  <td><b>${i}</b></td>
                                  <td>${alarmsObj[i].time}</td>
                                  <td style="color: red">once</td>
                                  <td><button class="remove my-btn">remove</button></td>
                               </tr>`;
              alarmTableBody.innerHTML += template;
            }
          });
        }
      }
    }).catch(err=>{
      console.log(err);
    });
}
loadAlarms();// load all alarms

// load duration================================================
function loadDur() {  
  chrome.storage.sync.get(null)
    .then(items=>{
      if(items){
        var f = items['flags'];
        var dur = items['dur'];
        if(f && dur){
          if(!f['surfTime']){// if break is not over
            // either break is pending(set) or not set
            if(dur['time'] && dur['time'] != -1){// if pending or set
              breakTime.innerHTML = `<p><i class="fas fa-coffee feature-btn"></i> Break after <b><big>${dur['time']} minutes</big></b> from ${dur['now']}<br><b class="warning"><i class="fas fa-exclamation-triangle"></i> </b><small>please do not disable the extension until break time reaches.</small></p>`;
            }
          }else{
            // set surfTime flag to false
            f['surfTime'] = false;
            // and also erase from storage
            // set duration time to default -1
            dur['time'] = -1;
            chrome.storage.sync.set({'flags': f, 'dur': dur});
          }
        }
      }
    })
}
loadDur();// load duration time

// add an alarm============================================================
alarmForm.addEventListener('submit',(e)=>{
  e.preventDefault();
  var alarmName = alarmForm.name.value.toUpperCase();// 1
  var dateTime = alarmForm.scheduledTime.value;
  var period = parseInt(alarmForm.period.value);// default number input returns string// 1.2

  var currentDate = new Date();
  var scehduledDate = new Date(dateTime);
  var msInterval = scehduledDate - currentDate;
  var localeString = scehduledDate.toLocaleString();// 1.1

  if(dateTime){
    if(msInterval <= 0){
      alert('Please set valid date and time');
    }else{
      // check if previously set?
      chrome.storage.sync.get("alarms")
        .then(items=>{
          if(items){
            var alarmsObj = items['alarms'];
            if(alarmsObj){
              var alarmKeys = Object.keys(alarmsObj);
              const timeArray = [];
              var i = 0;
              const alarmValues = Object.values(alarmsObj);
              alarmValues.forEach( v =>{
                timeArray[i++] = v.time;
              });
              
              if(alarmKeys.findIndex((k)=>{return k == alarmName;}) == -1 && timeArray.findIndex((t)=>{return t == localeString;}) == -1){
                // if not set,
                //  set in storage
                var alarm = {'time': localeString, 'period': period};
                alarmsObj[alarmName] = alarm;
                chrome.storage.sync.set({"alarms": alarmsObj})
                  .then(()=>{
                    // send info to bg script
                    chrome.runtime.sendMessage({
                      'alarmName': alarmName ,
                      'msInterval': msInterval,
                      'period': period,
                      'purpose': 'set'
                    }, function (response) { 
                        //  alarmForm.reset();
                      if(!isNaN(period)){
                        const template = `<tr>
                                            <td><i class="far fa-bell"></i></td>
                                            <td><b>${alarmName}</b></td>
                                            <td>${localeString}</td>
                                            <td>${period} min</td>
                                            <td><button class="remove my-btn">remove</button></td>
                                        </tr>`;
                        alarmTableBody.innerHTML += template;
                      }else{
                        const template = `<tr>
                                            <td><i class="far fa-bell"></i></td>
                                            <td><b>${alarmName}</b></td>
                                            <td>${localeString}</td>
                                            <td style="color: red;">once</td>
                                            <td><button class="remove my-btn">remove</button></td>
                                        </tr>`;
                        alarmTableBody.innerHTML += template;
                      }
                    });
                  }).catch(err=>{
                    console.log(err);
                  });
              }else{
                alert("Can't set duplicate alarm\nPlease change the alarm name or time, other than set before ");
              }
            }
          }
        }).catch(err=>{
          console.log(err);
        });
    }
  }else{
    alert('Please set valid date and time');
  }
});

// delete the alarms============================================================
alarmTableBody.addEventListener('click',(e)=>{
  if(e.target.classList.contains('remove')){
    const alarmToRemove = e.target.parentElement.parentElement.children[1].textContent.trim();// [name]
    // console.log();
    // send a msg to bg script to remove the alarm
    chrome.runtime.sendMessage({'name': alarmToRemove,'purpose': 'remove'},function(response){
      // console.log(response);
      // remove from the object value of "alarms" key
      chrome.storage.sync.get('alarms')
        .then(items=>{
          if(items){
            var alarmsValue = items['alarms'];// get the "alarms" value object
            // delete the key.value pair
            if(alarmsValue){
              delete(alarmsValue[alarmToRemove]);
              // set object back again
              chrome.storage.sync.set( { 'alarms': alarmsValue });
            }
          }
        }).catch(err=>{
          console.log(err);
        });
      //  Also remove from page
      e.target.parentElement.parentElement.remove();
    });
  }
});

// listen message coming from bg script to remove the alarm having no 'periodInMinutes'
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {  
  if(request.purpose == 'removeOneTime'){
    // already removed from storage in bg.js
    loadAlarms();// just relode
  }
});

// timer management ===================================================================
const browsingTime = document.querySelector('#elapsedTime');
const totalTimeData = document.querySelector('.total-time-data');
// first handshake with bg.js

//  get the elapsed time
setInterval(()=>{
  chrome.storage.local.get("time").then(items=>{
    var time = items["time"];
    var hour = Math.floor(time/3600);
    var r = time%3600;
    var minute = Math.floor(r/60);
    var second = r%60;
    if(hour<10) hour = '0'+hour;
    if(minute<10) minute = '0'+minute;
    if(second<10) second = '0'+second;
    browsingTime.innerHTML = `<span>${hour}</span> <span>${minute}</span> <span>${second}</span>`;

    chrome.storage.sync.get("time_history", (items)=>{
      var total_time = items["time_history"];

      var total_days = total_time.days;
      var total_hours = total_time.hours;
      var total_minutes = total_time.minutes;
      var total_seconds = total_time.seconds;

      if(total_days < 10) total_days = "0"+total_days;
      if(total_hours < 10) total_hours = "0"+total_hours;
      if(total_minutes < 10) total_minutes = "0"+total_minutes;
      if(total_seconds < 10) total_seconds = "0"+total_seconds;
      totalTimeData.innerHTML = `<span>${total_days}d</span>:<span>${total_hours}h</span>:<span>${total_minutes}m</span>:<span>${total_seconds}s</span>`;
    });
  });
   
}, 1000);

// break time management================================================
bdf.addEventListener('submit',(e)=>{
  e.preventDefault();
  var dur = (Math.floor(bdf.duration.value))*60;// seconds
  var now = new Date();
  if(dur >= 1){
    breakTime.innerHTML = `<p><i class="fas fa-coffee feature-btn"></i> Break after <b><big>${dur/60} minutes</big></b> from ${now.toLocaleTimeString()}<br><b class="warning"><i class="fas fa-exclamation-triangle"></i> </b><small>please do not disable the extension until break time reaches.</small></p>`;
    chrome.storage.sync.set({'dur': {'time': dur/60,'now': now.toLocaleTimeString()}})
      .then(()=>{
        chrome.runtime.sendMessage({'duration': dur, 'purpose': 'break'});
      }).catch(err=>{
        console.log(err);
      });
  }else{
    alert('Invalid duration entered\nPlease enter valid duration in minutes');
  }
  bdf.reset();
});

chrome.runtime.onMessage.addListener((request, sender,sendResponse)=>{
  if(request.purpose == 'breakover'){// break is over
    chrome.storage.sync.get('flags')
      .then(items=>{
        if(items){
          var x = items['flags'];
          x['surfTime'] = false;// set surfTime to false which was earlier true
          chrome.storage.sync.set({'flags': x});
        }
      }).catch(err=>{
        console.log(err);
      });
    chrome.storage.sync.get('dur')
      .then(items=>{
        if(items){
          // set duration time to default -1
          var d = items['dur'];
          d['time'] = -1;
          chrome.storage.sync.set({'dur': d});
        }
      }).catch(err=>{
        console.log(err);
      });
    breakTime.children[0].remove();// remove from the page
    sendResponse("recieved by popup");
  }
});
