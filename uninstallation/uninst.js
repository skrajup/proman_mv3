const form = document.querySelector(".feedback > form");
const quote = document.querySelector(".quote");

form.addEventListener("submit", (e)=>{
    e.preventDefault();
    // console.log(form.feedback.value);
    // chrome.storage.sync.get("feedbacks").then((items)=>{
    //     if(items && form.feedback.value.length > 0){
    //         const feedbacks = items["feedbacks"];
    //         if(feedbacks){
    //             feedbacks.push({
    //                 "date": new Date().toLocaleString(),
    //                 "feedback": form.feedback.value
    //             });
    //             chrome.storage.sync.set({"feedbacks": feedbacks }).then(()=>{
    //                 form.reset();
    //                 form.style.display = "none";
    //                 quote.style.display = "none";
    //                 const h1 = document.createElement("h1");
    //                 h1.textContent = "Thanks for letting us...";
    //                 document.querySelector(".feedback").appendChild(h1);
    //             }).catch(err=>{
    //                 console.log(err);
    //             });
    //         }
    //     }else{
    //         console.log("empty field");
    //     }
    // }).catch(err=>{
    //     console.log(err);
    // });
    form.reset();
    form.style.display = "none";
    quote.style.display = "none";
    const h1 = document.createElement("h1");
    h1.textContent = "Thanks for letting us...";
    document.querySelector(".feedback").appendChild(h1);
});