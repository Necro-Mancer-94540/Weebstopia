console.log("first");

function startPromise(id) {
    return new Promise((resolve, reject) => {
    console.log("promise Start");   
    // use id to fetch 
    setTimeout(() => {
        var data = "hi " + (id+5);
        resolve(data)
    } , 1000);
});
}

async function myAFunction() {
    console.log("Asyunc start");
    var res = await startPromise(4);
    console.log("Asyunc end");    
}

myAFunction();

console.log("second");
