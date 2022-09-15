console.log("content.js");

setInterval(()=>{
    console.log(1);
}, 1000);

window.onunload = ()=>{
    console.log("unload");
}

window.onfocus = ()=>{
    console.log("focussed");
}

window.onblur = ()=>{
    console.log("blurred");
}
console.log(window.origin);