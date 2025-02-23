import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";
import { getFirestore,collection,getDocs,addDoc
} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-firestore.js";
import {
    getAuth,onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js";
const firebaseConfig = {
    apiKey: "AIzaSyBu4qsN0ZMlISsQHce72GJy-OlwrIlQ-4s",
    authDomain: "engage-project-90ff7.firebaseapp.com",
    projectId: "engage-project-90ff7",
    storageBucket: "engage-project-90ff7.appspot.com",
    messagingSenderId: "179280498189",
    appId: "1:179280498189:web:5ccbfcdf6ba93d63630f44",
    measurementId: "G-ND82WTFL76"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const ssdMobilenetv1ModelReference = collection(db,"ssdMobilenetv1ModelReference");
const tinyFaceDetectorModelReference = collection(db,"tinyFaceDetectorModelReference");
const loadModels = async () => {
    //Function to load face-api.js models
    try{
        await faceapi.loadSsdMobilenetv1Model('/models');
        await faceapi.loadTinyFaceDetectorModel('/models');
        await faceapi.loadFaceLandmarkModel('/models');
        await faceapi.loadFaceLandmarkTinyModel('/models');
        await faceapi.loadFaceRecognitionModel('/models');
        await faceapi.loadFaceExpressionModel('/models');
    }
    catch(err){
        let errCode = err.code;
        let errorMessage = err.message;
    }
}
const getAllFaceMatchers = async (collectionReference) => {
    /*This function returns all face descriptions in the database and convert them into faceMatchers*/
    try{
        const snapshot = await getDocs(collectionReference);
        let answerArray = [];
        for(let j=0;j<snapshot.docs.length;j++){    //For every criminal
            let tempAns = [];
            const listofImagesForEachCriminal = snapshot.docs[j].data().image;
            const referenceName = snapshot.docs[j].data().displayName;
            for(let k=0;k<listofImagesForEachCriminal.length;k++){  //For every face description of a criminal
                const referenceFaceAfterParsing = Object.values(JSON.parse(listofImagesForEachCriminal[k]));    //parsing the JSON stored in the database
                const float32Array = new Float32Array(referenceFaceAfterParsing);
                const labeledFaceDescriptors = [new faceapi.LabeledFaceDescriptors(referenceName,[float32Array])];  //labelling the face description
                const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
                tempAns.push(faceMatcher);
            }
            answerArray.push(tempAns);
        }
        return answerArray;
    }
    catch(err){
        let errCode = err.code;
        let errorMessage = err.message;
        console.log(errCode);
        console.log(errorMessage);
    }
}   
loadModels();
const videoUploadInput = document.getElementById("videoUploadInput");
const videoUploadForm = document.getElementById("videoUploadForm");
const videoDiv = document.getElementById("videoDiv");
const videoSelect = document.getElementById("videoSelect");
const stopButton = document.getElementById("stopButton");
const exitButton = document.getElementById("exitbtn");
const pauseButton = document.getElementById("pauseButton");
const playButton = document.getElementById("playButton");
const landMarksButton = document.getElementById("landMarksButton");
const toggleButton = document.getElementById("toggle");
const formDiv = document.getElementById("formDiv");
const criminalLogsCollectionReference = collection(db,"criminalLog");
pauseButton.addEventListener("click",() => {
    //used to pause the video
    if(queryVideo){
        queryVideo.pause();
    }
})
playButton.addEventListener("click",() => {
    //used to play the video
    if(queryVideo.src == ""){
        window.alert("SUBMIT A VIDEO BEFORE PLAYING");
    }
    else{
        queryVideo.play();
    }
})
let cnt = 0;
toggleButton.addEventListener("click",() => {
    //button used to toggle full screen
    if(cnt%2==0){
        formDiv.style.display = "none";
        videoDiv.style.width = "98%";
    }
    else{
        formDiv.style.display = "inline-block";
        if(window.innerWidth<600){
            videoDiv.style.width = "98%";
        }
        else{
            videoDiv.style.width = "70%";
        }
    }
    cnt++;
})
let flag = 0;
landMarksButton.addEventListener("click",() =>{
    //used to toggle facelandmarks
    if(!flag){
        landMarksButton.innerText = "Remove Landmarks";
        flag = 1;
    }
    else{
        landMarksButton.innerText = "Add Landmarks";
        flag = 0;
    }
})
let queryVideo = document.createElement("video"),canvas;
queryVideo.muted = true;
const observer = new ResizeObserver((entries) => {      //used to adjust the canvas based on window width
    if(canvas && queryVideo){
        canvas.style.width = queryVideo.clientWidth;
        canvas.style.height = queryVideo.clientHeight;
    }
})
observer.observe(videoDiv);
stopButton.addEventListener("click",() => {
    //used to remove the query video
    if(queryVideo){
        videoUploadInput.value = null;
        queryVideo.pause();
        queryVideo.removeAttribute('src');
        queryVideo.load();
    }
    if(canvas){
        canvas.remove();
    }
})
exitButton.addEventListener("click",() => {
    window.location.href = "home.html";
})
let detections,faceMatchers;
const drawEverything = (async () => {     //function used get the best match from the database with everyface in the query image
    try{
        const displaySize = {width:queryVideo.clientWidth,height:queryVideo.clientHeight};
        if(canvas){
            canvas.remove();
        }
        canvas = faceapi.createCanvasFromMedia(queryVideo);
        faceapi.matchDimensions(canvas,displaySize);
        videoDiv.append(canvas);
        const resizedDetections = faceapi.resizeResults(detections,displaySize);
        const labelsForFaces = [];
        for(let i=0;i<resizedDetections.length;i++){        //for every face
            let tempBestMatch,tempAns = 2;
            for(let j=0;j<faceMatchers.length;j++){         //for every criminal
                for(let k=0;k<faceMatchers[j].length;k++){  //for every image of a particular criminal
                    const bestMatch = faceMatchers[j][k].findBestMatch(resizedDetections[i].descriptor);
                    if(tempAns > bestMatch.distance){
                        tempAns = bestMatch.distance;
                        tempBestMatch = bestMatch;
                    }
                }
            }
            labelsForFaces.push({distance:tempAns,bestMatch:tempBestMatch});
        }
        const results = [];
        for(let i=0;i<labelsForFaces.length;i++){
            results.push(labelsForFaces[i].bestMatch);
        }
        for(let i=0;i<results.length;i++){
            const newCriminalName = results[i]._label;
            if(newCriminalName != "unknown"){   //checking whether the criminal already exists in the found criminals array or not
                if(!foundCriminals.includes(newCriminalName)){  //if he is not present,he'll be added to the array and database
                    foundCriminals.push(newCriminalName);
                    const data = {nameOfTheCriminalFound: newCriminalName,foundBy: userEmail,dateFound: Date().toString().slice(0, 24),mediaUsed: "video",degreeOfSimilarity: 1-results[i]._distance};
                    await addDoc(criminalLogsCollectionReference,data);
                }
            }
        }
        canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height);
        results.forEach((result, i) => {
            if(flag){
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);      //displaying detection results
            }
            result._distance = 1 - result._distance;
            canvas.style.width = queryVideo.clientWidth;
            canvas.style.height = queryVideo.clientHeight;
            const box = resizedDetections[i].detection.box;
            const drawBox = new faceapi.draw.DrawBox(box,{label: result.toString()});
            drawBox.draw(canvas);
        })
    }
    catch(err){
        console.log(err);
        let errCode = err.code;
        let errorMessage = err.message;
    }
})
let userDisplayName,userEmail,userphotoURL;
onAuthStateChanged(auth,async (user) => {
    //used to authenticate users
    try{
        if(user){
            //if the user is a valid user
            if(user.emailVerified == true){
                user.providerData.forEach((profile) => {
                    userDisplayName = profile.displayName;
                    userEmail  = profile.email;
                    userphotoURL =  profile.photoURL;
                });
            }
        }
        else{
            //if the user is not valid(or doesnt exists)
            window.location.href = "../index.html";
        }
    }
    catch(err){
        window.alert("AUTHORIZATION ERROR");
        window.alert(err);
    }
})
let blobURL;
videoUploadInput.addEventListener("change",async (event) => {
    //retriving the video that we want to query against the images in database
    try{
        let file = event.target.files[0];
        blobURL = URL.createObjectURL(file);
    }
    catch(err){
        window.alert("PLEASE CHOOSE A VIDEO");
    }
})
let val;
videoUploadForm.addEventListener("submit",async (e) => {
    if(videoDiv.innerHTML != ""){
        videoDiv.innerHTML = "";
    }
    queryVideo.setAttribute("autoplay",true);
    queryVideo.setAttribute("src",blobURL);
    videoDiv.append(queryVideo);
    e.preventDefault();
    val = videoSelect.value;
    clearInterval(myInterval);
})
const playVideo = async () => {
    //this block of code runs for every 100 milli seconds
    if(canvas){
        canvas.remove();
    }
    if(val == 1){
        //val = 1 corresponds to detection by ssdmobilenetv1 model
        //using face-api.js functions to detect all faces in the query video with facelandmarks and facedescriptors
        detections = await faceapi.detectAllFaces(queryVideo,new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptors();
    }
    else if(val == 2){
        //val = 2 corresponds to detection by tinyfacedetector model
        //using face-api.js functions to detect all faces in the query video with facelandmarks and facedescriptors
        detections = await faceapi.detectAllFaces(queryVideo,new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
    }
    drawEverything();
}
let myInterval;
let foundCriminals = [];
queryVideo.addEventListener("play",async () => {
    try{
        foundCriminals = [];
        //getting all the facematchers based on the choice of the user
        if(val == 1){
            await getAllFaceMatchers(ssdMobilenetv1ModelReference).then((ans)=>{
                faceMatchers = ans;
            });
        }
        else if(val == 2){
            await getAllFaceMatchers(tinyFaceDetectorModelReference).then((ans)=>{
                faceMatchers = ans;
            });
        }
        myInterval = setInterval(playVideo,100);
    }
    catch(err){
        let errCode = err.code;
        let errorMessage = err.message;
        console.log(errCode);
        console.log(errorMessage);
        console.log(err);
    }
})
window.addEventListener("load", () => {
    div5.style.display = "none";
})