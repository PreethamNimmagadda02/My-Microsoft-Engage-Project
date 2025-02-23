import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";
import { getFirestore,collection,getDocs,addDoc
} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-firestore.js";
import {
    getAuth,onAuthStateChanged,
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
        window.alert("FAILED TO GET FACEMATCHERS");
        window.alert(err);
    }
}   
loadModels();
const imageUploadInput = document.getElementById("imgUploadInput");
const imageUploadForm = document.getElementById("imageUploadForm");
const imageDiv = document.getElementById("imageDiv");
const imageSelect = document.getElementById("imageSelect");
const stopButton = document.getElementById("stopButton");
const exitButton = document.getElementById("exitbtn");
const landMarksButton = document.getElementById("landMarksButton");
const criminalLogsCollectionReference = collection(db,"criminalLog");
let queryImage,canvas;
const observer = new ResizeObserver((entries) => {  //used to adjust the canvas based on window width
    if(canvas && queryImage){
        canvas.style.width = queryImage.clientWidth;
        canvas.style.height = queryImage.clientHeight;
    }
})
observer.observe(imageDiv);
stopButton.addEventListener("click",() => {     //function used to clear the image on the screen
    if(queryImage){
        queryImage.remove();
    }
    if(canvas){
        canvas.remove();
    }
})
let detections,faceMatchers;
const drawEverything = async () => {    //function used get the best match from the database with everyface in the query image
    try{
        if(canvas){
            canvas.remove();
        }
        const displaySize = {width:queryImage.clientWidth,height:queryImage.clientHeight};
        canvas = faceapi.createCanvasFromMedia(queryImage);
        faceapi.matchDimensions(canvas,displaySize);
        imageDiv.append(canvas);
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
        for(let i=0;i<results.length;i++){      //checking whether the criminal already exists in the found criminals array or not
            const newCriminalName = results[i]._label;  //if he is not present,he'll be added to the array and database
            if(newCriminalName != "unknown"){
                if(!foundCriminals.includes(newCriminalName)){
                    foundCriminals.push(newCriminalName);
                    const data = {nameOfTheCriminalFound: newCriminalName,foundBy: userEmail,dateFound: Date().toString().slice(0, 24),mediaUsed: "image",degreeOfSimilarity: 1-results[i]._distance};
                    await addDoc(criminalLogsCollectionReference,data);
                }
            }
        }
        canvas.getContext("2d").clearRect(0,0,canvas.width,canvas.height);  //displaying detection results
        results.forEach((result, i) => {
            if(flag){
                faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
            }
            result._distance = 1 - result._distance;
            const box = resizedDetections[i].detection.box;
            const drawBox = new faceapi.draw.DrawBox(box,{label: result.toString()});
            drawBox.draw(canvas);
            canvas.style.width = queryImage.clientWidth;
            canvas.style.height = queryImage.clientHeight;
        })
    }
    catch(err){
        let errCode = err.code;
        let errorMessage = err.message;
        console.log(errCode);
        console.log(errorMessage);
    }
}
let flag = 0;
landMarksButton.addEventListener("click",() =>{
    //used to toggle facelandmarks
    if(!flag){
        landMarksButton.innerText = "Remove Landmarks";
        flag = 1;
        drawEverything();
    }
    else{
        landMarksButton.innerText = "Add Landmarks";
        flag = 0;
        drawEverything();
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
        window.alert("AUTHENTICATION ERROR");
        window.alert(err);
    }
})
exitButton.addEventListener("click",() => {
    window.location.href = "home.html";
})
imageUploadInput.addEventListener("change",async () => {
    try{
        //retriving the image that we want to query against the images in database
        queryImage = await faceapi.bufferToImage(imageUploadInput.files[0]);
    }
    catch(err){
        window.alert("PLEASE CHOOSE AN IMAGE");
    }
})
let foundCriminals = [];
imageUploadForm.addEventListener("submit",async (e) => {
    try{
        foundCriminals = [];
        e.preventDefault();
        imageDiv.innerHTML = "";
        imageDiv.append(queryImage);
        const val = imageSelect.value;
        if(val == 1){
            //val = 1 corresponds to detection by ssdmobilenetv1 model
            //using face-api.js functions to detect all faces in the query image with facelandmarks and facedescriptors
            detections = await faceapi.detectAllFaces(queryImage,new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptors();
            await getAllFaceMatchers(ssdMobilenetv1ModelReference).then((ans)=>{
                faceMatchers = ans;
            });
        }
        else if(val == 2){
            //val = 2 corresponds to detection by tinyfacedetector model
            //using face-api.js functions to detect all faces in the query image with facelandmarks and facedescriptors
            detections = await faceapi.detectAllFaces(queryImage,new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
            await getAllFaceMatchers(tinyFaceDetectorModelReference).then((ans)=>{
                faceMatchers = ans;
            });
        }
        drawEverything();
    }
    catch(err){
        let errCode = err.code;
        let errorMessage = err.message;
        console.log(errCode);
        console.log(errorMessage);
    }
})
window.addEventListener("load", () => {
    div5.style.display = "none";
})