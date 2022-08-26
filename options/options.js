//todo management =====================================================================================
const addForm = document.querySelector('.add');
const todosList = document.querySelector('.todos');//ul
const search = document.querySelector('.search input');
const taskscount = document.querySelector('.taskscount');
var todo = 0, ongoing = 0, done = 0;

//sites
const genBlockerForm = document.querySelector('#gen-blocker-form');
const genBlockList = document.querySelector('#gen-block-list');
const blockCount = document.querySelector('#blockGenUrlsCount');
const blockedSiteskey = "sitesToBeBlocked";

//load todos function============================================================
function loadtodos() {  
    todo = 0;
    ongoing = 0;
    done = 0;
    todosList.innerHTML = ``;
    chrome.storage.sync.get('todos')
        .then(items=>{
            taskscount.innerHTML = `<span class="badge bg-danger">to-do: ${todo}</span> <span class="badge bg-warning">ongoing: ${ongoing}</span> <span class="badge bg-primary">done: ${done}</span>`;

            if(items){
                var x = items['todos'];
                if(x){
                    x.forEach( i => {
                        const htmlTemplate = `
                            <li class="list-group-item d-flex justify-content-between align-item-center">
                                <span> ${i['title']} <br><span class="badge bg-dark">${i['start']}</span> <i class="fa-thin fa-right-long"></i> <span class="badge bg-dark">${i['end']}</span> <span class="badge bg-info">${i['status']}</span></span>
                                <i class="far fa-trash-alt delete"></i>
                            </li>
                        `;
                        todosList.innerHTML+=htmlTemplate;
                        if(i['status'] == 'to-do')  todo++;
                        if(i['status'] == 'ongoing') ongoing++;
                        if(i['status'] == 'done') done++;
                    });
                }
            }
            taskscount.innerHTML = `<span class="badge bg-danger">to-do: ${todo}</span> <span class="badge bg-warning">ongoing: ${ongoing}</span> <span class="badge bg-primary">done: ${done}</span>`;
        }).catch(err=>{
            console.log(err);
        });
}
loadtodos();//load all todos at once================================================

//load blockedsites function============================================================
function loadsites() {  
    console.log("sites loaded");
    genBlockList.innerHTML = ``;
    // var sites = JSON.parse(localStorage.getItem(blockedSiteskey));
    chrome.storage.sync.get("rules")
        .then(items=>{
            if(items){
                const rules = items["rules"];
                if(rules){
                    rules.forEach( rule => {
                        const htmlTemplate = `<li class="list-group-item d-flex justify-content-between align-item-center">
                            <span id="site">${rule.id}</span> 
                            <span>${rule.urlFilter} </span>
                            <i class="far fa-trash-alt delete"></i></li>`;
                        genBlockList.innerHTML+=htmlTemplate;
                    });
                    //count update
                    blockCount.innerHTML = `${rules.length} site(s) blocked`;
                }
            }
        }).catch(err=>{
            console.log(err);
        });
}
loadsites();//load all sites at once================================================

// loadnotes();//load all notes at once===============================================

//Add todos start================================================================
addForm.addEventListener('submit',e =>{
    e.preventDefault();//prevent default refreshing upon submission

    const todo_title = addForm.add.value.trim();//trim leading and trailing spaces
    const start_date = addForm.startdate.value;
    const end_date = addForm.enddate.value;
    const status = 'to-do';
    const start = new Date(start_date);
    const end = new Date(end_date);

    if(todo_title.length && start_date !== '' && end_date !== '' && start > new Date() && end > new Date() && end > start){
        var x = {title: todo_title, start: start.toLocaleString(), end: end.toLocaleString(), status: 'to-do'};
        //console.log(x);
        chrome.storage.sync.get('todos')
            .then(items=>{
                var y = items['todos'];
                if(y){
                    y[y.length] = x;
                    chrome.storage.sync.set({'todos': y });
                }
            }).catch(err=>{
                console.log(err);
            });
        //appendTodoHtml(todo_title,start.toLocaleString(),end.toLocaleString(),status);
        addForm.reset();
    }else{
        alert('invalid date & time');
    }
});
//Add todos end===================================================================

//if clicked on target trash icon just delete that 
todosList.addEventListener('click',e => {
    if(e.target.classList.contains('delete')){//fine, bcz delete class is specific to trash
        var allElements = Array.from(e.target.parentElement.parentElement.children);
        var elementToFind = e.target.parentElement;
        // console.log(e.target.previousElementSibling.children[4].textContent);
        var index = allElements.indexOf(elementToFind);
        //remove from the storage
        if(index != -1){//element is found at index index
            chrome.storage.sync.get('todos')
                .then(items=>{
                    var x = items['todos'];
                    if(x){
                        x.splice(index, 1);
                        chrome.storage.sync.set({'todos': x});
                    }
                }).catch(err=>{
                    console.log(err);
                });
        }else{
            alert('element not found');
        }
        //remove from the page 
        e.target.parentElement.remove();
    }
});
//Delete todos end====================================================================

//search  in todos====================================================================
function filterTodos(term) { 
    //for unmatched, add filtered class
    Array.from(todosList.children)
    .filter(function (todo) { 
        return !todo.textContent.toLowerCase().includes(term);//.includes(term)
     })
    .forEach(function (unmatched) { 
        unmatched.classList.add('filtered');//display none
    })
    //for matched, remove filtered class
    Array.from(todosList.children)
    .filter(function (todo) { 
        return todo.textContent.toLowerCase().includes(term);//.includes(term)
     })
    .forEach(function (matched) { 
        matched.classList.remove('filtered');//display again
    })
}
search.addEventListener('keyup',() => {
    const term = search.value.trim().toLowerCase();
    filterTodos(term);
});

//suppose options is open and status is changed by background.js, then we have to update it in tha page at the instant....
//listen for the event onChanged on chrome.storage when options is open
chrome.storage.onChanged.addListener((changes, area)=>{
    if( area == 'sync' && changes.todos?.newValue ){
        todo = 0;
        ongoing = 0;
        done = 0;
        todosList.innerHTML = ``;
    
        var x = changes.todos.newValue;
        //console.log(x);
        x.forEach( i => {
            const htmlTemplate = `
                <li class="list-group-item d-flex justify-content-between align-item-center">
                    <span> ${i['title']} <br><span class="badge bg-dark">${i['start']}</span> <i class="fa-thin fa-right-long"></i> <span class="badge bg-dark">${i['end']}</span> <span class="badge bg-info">${i['status']}</span></span>
                    <i class="far fa-trash-alt delete"></i>
                </li>
            `;
            todosList.innerHTML+=htmlTemplate;
            if(i['status'] == 'to-do')  todo++;
            if(i['status'] == 'ongoing') ongoing++;
            if(i['status'] == 'done') done++;
        });
        taskscount.innerHTML = `<span class="badge bg-danger">to-do: ${todo}</span> <span class="badge bg-warning">ongoing: ${ongoing}</span> <span class="badge bg-primary">done: ${done}</span>`;
    }
});
//=======================================================================================================

// site blacklisting starts here ===================================================================

//=======================================================================================================
function appendGenUrl(rule){
    //console.log(url);
    const genUrlTemplate = `<li class="list-group-item d-flex justify-content-between align-item-center">
                                <span id="site">${rule.id}</span> 
                                <span>${rule.urlFilter} </span> 
                                <i class="far fa-trash-alt delete"></i>
                            </li>`;
    genBlockList.innerHTML += genUrlTemplate;
}

genBlockerForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    const genUrl = genBlockerForm.genUrl.value.trim();
    var pattern = new RegExp('^(https?:\\/\\/)?' +
				'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' +
				'((\\d{1,3}\\.){3}\\d{1,3}))' +
				'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
				'(\\?[;&a-z\\d%_.~+=-]*)?' +
				'(\\#[-a-z\\d_]*)?$', 'i');
    
    const isValidUrl = genUrl != '' && genUrl.indexOf(".") !== -1 && pattern.test(genUrl);
    if(isValidUrl){
        const hostl = getLocation(genUrl).host;
        var rules = [];
        chrome.storage.sync.get(["available_ids", "max__rule__id","rules"])
            .then(items=>{
                if(items){
                    rules = items["rules"];
                    var id;
                    var available_ids = items["available_ids"];
                    var max__rule__id = items["max__rule__id"];
                    if(available_ids.length > 0){
                        id = available_ids[available_ids.length - 1];
                        available_ids.splice(available_ids.length - 1, 1);
                    }else{
                        id = max__rule__id + 1;
                        max__rule__id = max__rule__id + 1;
                    }
                    const url__data = {
                        "id": id,
                        "urlFilter": hostl
                    };

                    if(rules && rules.findIndex(rule => {return rule.urlFilter === url__data.urlFilter;}) === -1){
                        rules.push(url__data);
                        chrome.storage.sync.set({"available_ids": available_ids, "max__rule__id": max__rule__id, "rules": rules, "flags": {block: 2, rule__id: url__data.id}})
                        .then(()=>{
                            blockCount.innerHTML = `${rules.length} site(s) blocked`;
                            genBlockerForm.reset(); 
                            appendGenUrl(url__data);
                            loadsites();//load from chrome.storage on the page
                        }).catch(err=>{
                            console.log(err);
                        });
                    } else {
                        alert("site is already blocked.");
                    }
                }
            }).catch(err=>{
                console.log(err);
            });
    }
});
//=======================================================================================================

//=====================================================================================================
genBlockList.addEventListener('click',e => {
    if(e.target.classList.contains('delete')){//fine, bcz delete class is specific to trash
        //just hit trial to get the end of link icon
        const rule__id = parseInt(e.target.parentElement.children[0].innerText.trim());
        // remove from page
        console.log(e.target.parentElement);
        // update storage and set info to let bg.js to unblock the request
        chrome.storage.sync.get(["available_ids", "rules"])
            .then(items=>{
                if(items){
                    const rules = items["rules"];
                    if(rules){
                        const idx = rules.findIndex(rule=>{
                            return rule.id === rule__id;
                        });
                        if(idx != -1){
                            rules.splice(idx, 1);
                            var available_ids = items["available_ids"];
                            available_ids.push(rule__id);
                            //instant count update
                            blockCount.innerHTML = `${rules.length} site(s) blocked`;
                            chrome.storage.sync.set({"rules": rules, "available_ids": available_ids, "flags": {block: 3, rule__id: rule__id}})
                                .then(()=>{
                                    loadsites();//load from storage on the page
                                }).catch(err=>{
                                    console.log(err);
                                });
                        }else{
                            console.log("rule__id does not match");
                        }
                    }
                }
            }).catch(err=>{
                console.log(err);
            });
    }
    
});
//=====================================================================================================

// //make notes==========================================================================================

// var notesform = document.querySelector('#notesform');
// var clear = document.querySelector('#clear');
// var preview = document.querySelector('#preview');
// var save = document.querySelector('#save');
// var saved = document.querySelector('.saved');
// var removeNote = document.querySelector('.removeNote');

// save.addEventListener('click', function (e) { 
//     e.preventDefault();
//     var note_title = notesform.notetitle.value.trim();
//     var note_detail = notesform.detail.value.trim();
//     //set localstorage
//     var notes = JSON.parse(localStorage.getItem('notes'));
//     notes[notes.length] = {[note_title]: note_detail};
//     localStorage.setItem('notes', JSON.stringify(notes));
//     loadnotes();
//     notesform.reset();
// });

// removeNote.addEventListener('click', function (e) {
//     e.preventDefault();
    
// })

// //====================================================================================

// //===============================load notes===========================================
// function loadnotes() { 
//     var saved = document.querySelector('.saved');
//     saved.innerHTML=``;
//     var notes = JSON.parse(localStorage.getItem('notes'));
//     notes.forEach(note=>{
//         var title = Object.keys(note)[0];
//         var detail = note[title];
//         var note_template = `<div class="card-body note">
//                                 <h5 class="card-title note-title"> ${title}</h5>
//                                 <p class="card-text note-detail">${detail}</p>
//                                 <button class="removeNote">remove</button>
//                             </div>`;
    
//         saved.innerHTML+=note_template;
//     })
// }
//====================================================================================
function getLocation(href) {  
    var loc = document.createElement('a');
    loc.href = href;
    return loc;
}