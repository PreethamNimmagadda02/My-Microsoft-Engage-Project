import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";
import { getFirestore,collection,
    getDocs,deleteDoc,doc
    ,getDoc,updateDoc,setDoc
} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-firestore.js";
import {
    getAuth,onAuthStateChanged,signOut
} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js";
import {
    getStorage,ref,uploadBytes,
    getDownloadURL,list,deleteObject
} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-storage.js";
const firebaseConfig = {
    apiKey: "AIzaSyBu4qsN0ZMlISsQHce72GJy-OlwrIlQ-4s",
    authDomain: "engage-project-90ff7.firebaseapp.com",
    projectId: "engage-project-90ff7",
    storageBucket: "engage-project-90ff7.appspot.com",
    messagingSenderId: "179280498189",
    appId: "1:179280498189:web:5ccbfcdf6ba93d63630f44",
    measurementId: "G-ND82WTFL76"
};
/*NOTE: there are 4 collection references
1.Criminal data with ssdMobilenetv1ModelReference
2.Criminal data with tinyFaceDetectorModelReference
3.Updated Criminals list
4.admins List
5.updated adminslist
and Doc id of criminalCollectionReferences is their displayName
doc id of adminCollectionReference is their email*/
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage();

const webpages = ["/HTML FILES/image.html","/HTML FILES/video.html","/HTML FILES/webcam.html"];
const liElements = document.getElementsByTagName("li");
const div1 = document.getElementById("div1");
const div2 = document.getElementById("div2");
const div3 = document.getElementById("div3");
const div4 = document.getElementById("div4");
const div5 = document.getElementById("div5");
const div6 = document.getElementById("div6");
const div7 = document.getElementById("div7");
const div8 = document.getElementById("div8");
const div9 = document.getElementById("div9");
const menuIcon = document.getElementById("menuIcon");
const logsTable = document.getElementById("logsTable");
const searchForm = document.getElementById("searchForm");
const resultsDiv = document.getElementById("resultsDiv");
const logsButton = document.getElementById("logsButton");
const adminsTable = document.getElementById("adminsTable");
const profileImage = document.getElementById("profileImage");
const addAdminForm = document.getElementById("addAdminForm");
const adminButtons = document.getElementsByClassName("admin");
const signOutButton = document.getElementById("signOutButton");
const signOutButton2 = document.getElementById("signOutButton2");
const addCriminalForm = document.getElementById("addCriminalForm");
const removeAdminForm = document.getElementById("removeAdminForm");
const findAdminsButton = document.getElementById("findAdminsButton");
const startButtons = document.getElementsByClassName("startButtons");
const displayAllCriminals = document.getElementById("displayAllCriminals");
const viewAddedAndRemovedTable = document.getElementById("viewAddedAndRemovedTable");
const viewAddedAndRemovedButton = document.getElementById("viewAddedAndRemovedButton");
const removeCriminalWithNameForm = document.getElementById("removeCriminalWithNameForm");
const removeCriminalWithImageForm = document.getElementById("removeCriminalWithImageForm");
const viewAddedAndRemovedButtonAdmin = document.getElementById("viewAddedAndRemovedButtonAdmin");
const containers = [div1,div2,div3,div4,div5,div6,div7,div8,div9];

const adminCollectionReference = collection(db,"admins");
const criminalLogsCollectionReference = collection(db,"criminalLog");
const updatedAdminsCollectionReference = collection(db,"updatedAdmins");
const updatedCriminalsCollectionReference = collection(db,"updatedCriminals");
const ssdMobilenetv1ModelReference = collection(db,"ssdMobilenetv1ModelReference");
const collectionReferenceArray = ["ssdMobilenetv1ModelReference","tinyFaceDetectorModelReference"];

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
const searchCollectionForBestImage = async (collectionReference,queryFaces) => {
    /*This function finds the best match for a given image(image may contain multiple faces)*/
    /*Returns an array of objects where each object contains the docID of the best matched criminal and percentage of dissimilarity*/
    const snapshot = await getDocs(collectionReference);
    let answerArray = [];
    let len = queryFaces.length;
    for(let i=0;i<len;i++){     //For every face in queryImage
        let tempAns = 2;
        let docId = null;
        for(let j=0;j<snapshot.docs.length;j++){    //For every criminal
            const listofImagesForEachCriminal = snapshot.docs[j].data().image;
            const referenceName = snapshot.docs[j].data().displayName;
            for(let k=0;k<listofImagesForEachCriminal.length;k++){  //For every face description of a particular criminal
                const referenceFaceAfterParsing = Object.values(JSON.parse(listofImagesForEachCriminal[k]));    //parsing the descriptors
                const float32Array = new Float32Array(referenceFaceAfterParsing);       //Changing the datatype
                const labeledFaceDescriptors = [new faceapi.LabeledFaceDescriptors(referenceName,[float32Array])];  //labelling the face descriptors
                const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
                const bestMatch = faceMatcher.findBestMatch(queryFaces[i].descriptor);      //finding the bestmatch
                if(bestMatch.distance<=tempAns){
                    tempAns = bestMatch.distance;
                    docId = snapshot.docs[j].id;
                }
            }
        }
        answerArray.push({ans:tempAns,docId:docId});    //pushing the resultant object into answer array for every queryFace
    }
    return answerArray;
}
loadModels();
const createCriminalCard = async (itemRef,nameOfTheCriminal) => {
    /*This function is used in find criminals feature
    Creates a card containing the details of the criminal*/ 
    try{
        const url = await getDownloadURL(itemRef);  //retriving the downloadURL for the file
        const docReference = await doc(db,"ssdMobilenetv1ModelReference",nameOfTheCriminal);
        const snapshot = await getDoc(docReference);    //retriving the criminaldata
        const wantedFor = snapshot.data().wantedFor;
        const otherDetails = snapshot.data().otherDetails;
        const resultsImageContainer = document.createElement("div");    //DOM manipulation
        const resultsImage = document.createElement("img");
        const resultsName = document.createElement("p");
        const resultsWantedFor = document.createElement("p");
        const resultsOtherDetails = document.createElement("p");
        resultsImageContainer.setAttribute("class","resultsImageContainer");
        resultsImage.setAttribute("class","resultsImage");
        resultsName.setAttribute("class","resultsName");
        resultsWantedFor.setAttribute("class","resultsName");
        resultsOtherDetails.setAttribute("class","resultsName");
        resultsImageContainer.style.display = "inline-block";
        resultsImage.setAttribute("src",url);
        resultsName.innerText = nameOfTheCriminal
        resultsWantedFor.innerText = "Wanted For: " + wantedFor;
        resultsOtherDetails.innerText = "Other Details: " + otherDetails;
        resultsImageContainer.appendChild(resultsImage);
        resultsImageContainer.appendChild(resultsName);
        resultsImageContainer.appendChild(resultsWantedFor);
        resultsImageContainer.appendChild(resultsOtherDetails);
        resultsDiv.appendChild(resultsImageContainer);
    }
    catch(err){
        window.alert("AN ERROR OCCURED, PLEASE TRY AGAIN LATER");
        window.alert(err);
    }
}
let userDisplayName;    /*Details of the current user signed in*/
let userEmail;
let userphotoURL;
const showProfile = async() => {        //Displays the profile of the user in profile section
    const pathReference = ref(storage,userphotoURL);    //retriving the photo from the storage(name of the file is same as the name of the user)
    const url = await getDownloadURL(pathReference);    //retriving the downloadURL of the pathreference
    profileImage.setAttribute("src",url);
    const userNamePara = document.getElementById("userName");
    const emailPara = document.getElementById("userEmail");
    userNamePara.innerText = `UserName: ${userDisplayName}`;
    emailPara.innerText = `Email: ${userEmail}`;
}
const makeStr = (str) => {
    const res1 = str.trim();
    const res2 = res1.toLowerCase();
    return res2;
}
const removeDocfromDataBase = async(name) => {
    //This function is used to remove criminal Data from the database
    try{
        const docReference = [];
        for(let i=0;i<2;i++){
            docReference.push(doc(db,collectionReferenceArray[i],name));    //storing the references of the docs that are needed to be deleted
            await deleteDoc(docReference[i]);   //firebase function to delete a doc from a collection
        }
        const docReference3 = doc(db,"updatedCriminals",name);
        //updating the data of the table by the admin who removed the criminal from the database
        await updateDoc(docReference3,{removedBy: userDisplayName,dateRemoved: Date().toString().slice(0, 24)});    //Firebase function to update data in a doc
        flag = 1;
    }
    catch(err){
        window.alert("AN ERROR OCCURED, PLEASE TRY AGAIN LATER");
        window.alert(err);
    }
}
signOutButton.addEventListener("click",() => {
    //This firebase function is used to signout users
    try{
        signOut(auth);
    }
    catch{
        let errCode = err.code;
        let errorMessage = err.message;
        console.log(errCode);
        console.log(errorMessage);
    }
})
let flag3 = 1;
logsButton.addEventListener("click", async () => {
    if(flag3){
        try{
            const snapshot = await getDocs(criminalLogsCollectionReference);
            for(let i=0;i<snapshot.docs.length;i++){
                const criminalDetails = snapshot.docs[i].data();
                const data = [criminalDetails.nameOfTheCriminalFound,
                    criminalDetails.foundBy,
                    criminalDetails.dateFound,
                    criminalDetails.mediaUsed,
                    criminalDetails.degreeOfSimilarity];
                const tr = document.createElement("tr");
                for(let j=0;j<5;j++){
                    const temptd = document.createElement("td");
                    temptd.innerText = data[j];
                    tr.appendChild(temptd);
                }
                logsTable.appendChild(tr);
            }
            flag3 = 0;
        }
        catch(err){
            window.alert("AN ERROR OCCURED, PLEASE TRY AGAIN LATER");
            window.alert(err);
        }
    }
})
let flag = 1;
viewAddedAndRemovedButton.addEventListener("click",async () => {
    /*Displaying a table containing the details of the criminal
    criminalName,addedBy,dateAdded,removedBy,dateRemoved*/
    if(flag){
        try{
            const snapshot = await getDocs(updatedCriminalsCollectionReference);    //retriving the data of the criminals from the collection reference
            for(let i=0;i<snapshot.docs.length;i++){    //for every criminal we are storing the data in a table
                const criminalDetails = snapshot.docs[i].data();
                const data = [criminalDetails.displayName,
                    criminalDetails.addedBy,
                    criminalDetails.dateAdded,
                    criminalDetails.removedBy,
                    criminalDetails.dateRemoved]
                const tr = document.createElement("tr");
                for(let j=0;j<5;j++){
                    const temptd = document.createElement("td");
                    temptd.innerText = data[j];
                    tr.appendChild(temptd);
                }
                viewAddedAndRemovedTable.appendChild(tr);
            }
            flag = 0;   //this flag is used to prevent loading until next change is made in the table
        }
        catch(err){
            window.alert("AN ERROR OCCURED, PLEASE TRY AGAIN LATER");
            window.alert(err);
        }
    }
})
const load = (container) => {
    for(let i=0;i<containers.length;i++){
        containers[i].style.display = "none";
    }
    container.style.display = "block";
    container.style.zIndex = "2";
}
for(let i=0;i<liElements.length-1;i++){
    liElements[i].addEventListener("click",() => {
        load(containers[i]);
    })
}
for(let i=0;i<startButtons.length;i++){
    startButtons[i].addEventListener("click", () => {
        window.location.href = webpages[i];
    })
}
let criminalImage1;
const criminalImageUpload1 = document.getElementById("criminalImageInput");
criminalImageUpload1.addEventListener("change", async () => {
    criminalImage1 = await faceapi.bufferToImage(criminalImageUpload1.files[0]);    //image of the criminal who is about to get added to the database
})
addCriminalForm.addEventListener("submit",async (e) => {
    try{
        e.preventDefault();
        const displayNameBefore = addCriminalForm.displayName.value;
        const displayName = makeStr(displayNameBefore);
        const wantedFor = addCriminalForm.wantedFor.value;
        const otherDetails = addCriminalForm.otherDetails.value;
        const referenceFace = [],referenceFaceString = [],docReference = [],criminalWithSameName = [];
        let temp1,temp2;
        for(let i=0;i<2;i++){
            //faceapi function to detect all faces present in the given image submitted by the user with facelandmarks and facedescriptors
            if(i==0){   //This refers to detecting all faces with ssdmoblienetv1 model
                temp1 = await faceapi.detectAllFaces(criminalImage1,new faceapi.SsdMobilenetv1Options()).withFaceLandmarks().withFaceDescriptors();
                referenceFace.push(temp1);
            }
            else if(i==1){  //This refers to detecting all faces with tinyfacedetector model
                temp2 = await faceapi.detectAllFaces(criminalImage1,new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptors();
                referenceFace.push(temp2);
            }
        }
        /*Image should contain exactly one face because we are specifying the name of one criminal(not multiple)*/
        if(temp1.length == 0 || temp2.length == 0){
            window.alert("NO FACE DETECTED PLEASE TRY AGAIN LATER");
            return 
        }
        else if(temp1.length != 1 || temp2.length != 1){
            window.alert("IMAGE SHOULD CONTAIN ONLY ONE FACE");
            return 
        }
        /*It will take more time to retrive an image from the database than an array of floating point numbers
        Only the face descriptors of the criminal will be stored by converting it into JSON*/
        for(let i=0;i<2;i++){
            referenceFaceString.push(JSON.stringify(referenceFace[i][0].descriptor));
            docReference.push(doc(db,collectionReferenceArray[i],displayName));
            criminalWithSameName.push(await getDoc(docReference[i]));
        }
        //Checking whether criminal with the same name exists or not
        if(criminalWithSameName[0].data()){
            //if exists, adding another face description to the criminal
            window.alert("CRIMINAL WITH THE SAME NAME EXISTS.\nADDING ANOTHER FACE DESCRIPTION TO THE CRIMINAL.");
            const criminalImgArray = [];
            for(let i=0;i<2;i++){
                criminalImgArray.push(criminalWithSameName[i].data().image);
                criminalImgArray[i].push(referenceFaceString[i]);
                await updateDoc(docReference[i],{image: criminalImgArray[i]});  //Firebase function to update a doc
            }
            window.alert("ANOTHER FACE DESCRIPTION ADDED TO THE EXISTING CRIMINAL");
        }
        else{
            //else creating a new doc for the criminal
            let file = criminalImageUpload1.files[0];
            const storageRef = ref(storage,"criminals/" + `${displayName}`);
            await uploadBytes(storageRef,file);
            const criminalData = [];
            for(let i=0;i<2;i++){
                // i=0 for ssdmobilenetv1 model, i=1 for tinyfacedetector model
                let temp = {displayName: displayName,image: [referenceFaceString[i]],otherDetails: otherDetails,wantedFor: wantedFor};
                criminalData.push(temp);
            }
            const data = {displayName: displayName,addedBy: userDisplayName,dateAdded: Date().toString().slice(0, 24),dateRemoved: "",removedBy: ""};
            await setDoc(doc(db,"updatedCriminals",displayName),data);  //this line of code creates a doc
            for(let i=0;i<2;i++){
                await setDoc(doc(db,collectionReferenceArray[i],displayName),criminalData[i]);  //this line of code creates a doc
            }
            flag = 1;
            window.alert("NEW CRIMINAL SUCCESSFULLY ADDED TO THE DATABASE.");
        }
    }
    catch(err){
        window.alert("AN ERROR OCCURED, PLEASE TRY AGAIN");
        window.alert(err);
    }
    addCriminalForm.reset();
})
signOutButton2.addEventListener("click",() => {
    //This firebase function is used to signout users
    try{
        signOut(auth);
    }
    catch(err){
        window.alert("SIGNOUT FAILED");
        window.alert(err);
    }
})
removeCriminalWithNameForm.addEventListener("submit",async (e) => {
    e.preventDefault();
    try{
        const snapshot = await getDocs(ssdMobilenetv1ModelReference);
        if(snapshot.docs.length == 1){
            window.alert("Database contains only one criminal, can't remove him");
            return
        }
        const displayNameBefore = removeCriminalWithNameForm.displayName.value;
        const displayName = makeStr(displayNameBefore);
        removeDocfromDataBase(displayName);     //Removing the data from firestore by calling a user defined function
        const fileReference = ref(storage,"criminals/" + `${displayName}`); //Removing the image of the criminal in firebase storage
        await deleteObject(fileReference);
        window.alert("CRIMINAL REMOVED SUCCESSFULLY");
    }
    catch(err){
        window.alert("CRIMINAL DOESNT EXIST IN THE DATABASE");
    }
    removeCriminalWithNameForm.reset();
})
let criminalImage2;
const criminalImageUpload2 = document.getElementById("criminalImageInputForDelete");
criminalImageUpload2.addEventListener("change", async () => {
    criminalImage2 = await faceapi.bufferToImage(criminalImageUpload2.files[0]);    //Image of the criminal who is about to get deleted from the database
})
removeCriminalWithImageForm.addEventListener("submit",async (e) => {
    e.preventDefault();
    try{
        const snapshot = await getDocs(ssdMobilenetv1ModelReference);
        if(snapshot.docs.length == 1){
            window.alert("Database contains only one criminal, can't remove him");
            return
        }
        /*Image should contain one face cause there is one face associated with one criminal*/
        //faceapi function to detect all faces in the given image with facelandmarks and facedescriptors
        const removeFaces = await faceapi.detectAllFaces(criminalImage2).withFaceLandmarks().withFaceDescriptors();
        const myobj = await searchCollectionForBestImage(ssdMobilenetv1ModelReference,removeFaces); //function used to search for the best match in the database
        if(myobj.length == 0){
            window.alert("NO FACE DETECTED, PLEASE TRY AGAIN LATER");
            return 
        }
        else if(myobj.length != 1){
            window.alert("IMAGE SHOULD CONTAIN ONLY ONE FACE");
            return 
        }
        if(myobj[0].docId && myobj[0].ans<=0.5){    //making sure that the best match from the database is close enough to match the criminal
            const tempDocId = myobj[0].docId;
            const docReference3 = doc(db,"updatedCriminals",tempDocId);
            const docReference = [];
            //i=0 refers to deleting from ssdmobilenetv1 model
            //i=1 refers to deleting from tinyfacedetector model
            for(let i=0;i<2;i++){
                docReference.push(doc(db,collectionReferenceArray[i],tempDocId));
                await deleteDoc(docReference[i]);   //deleting the doc from the database
            }
            //deleting the criminal image from the firebase storage
            await updateDoc(docReference3,{removedBy: userDisplayName,dateRemoved: Date().toString().slice(0, 24)});
            const fileReference = ref(storage,"criminals/" + `${tempDocId}`);
            await deleteObject(fileReference);
            window.alert("CRIMINAL REMOVED SUCCESSFULLY");
        }
        else{
            window.alert("CRIMINAL DOESNT EXIST IN THE DATABASE");
        }
    }
    catch(err){
        window.alert("AN ERROR OCCURED, PLEASE TRY AGAIN");
        window.alert(err);
    }
    removeCriminalWithImageForm.reset();
})
addAdminForm.addEventListener("submit",async (e) => {
    e.preventDefault();
    try{
        const displayName = addAdminForm.displayName.value;
        const email = addAdminForm.email.value;
        const docReference = doc(db,"admins",email);
        const adminWithTheSameName = await getDoc(docReference);
        //checking whether the user is already an admin or not
        if(adminWithTheSameName.data()){
            window.alert("USER IS ALREADY AN ADMIN");
        }
        else{
            //If the user is not a pre existing mail...
            const data = {displayName: displayName,email: email};
            await setDoc(docReference,data);
            const tableData = {displayName: displayName,email: email,addedBy: userDisplayName,dateAdded: Date().toString().slice(0, 24),dateRemoved: "",removedBy: ""};
            const docId = email;
            await setDoc(doc(db,"updatedAdmins",docId),tableData);
            window.alert(`${displayName} IS NOW AN ADMIN`);
            flag2 = 1;
        }
    }
    catch(err){
        window.alert("AN ERROR OCCURED, PLEASE TRY AGAIN");
        window.alert(err);
    }
    addAdminForm.reset();
})
removeAdminForm.addEventListener("submit",async (e) =>{
    e.preventDefault();
    try{
        const snapshot = await getDocs(adminCollectionReference);
        if(snapshot.docs.length == 1){
            window.alert("Database contains only one admin, can't remove him");
            return
        }
        const email = removeAdminForm.email.value;
        if(email == "vanumdaniel7@gmail.com"){
            window.alert("YOU CANT REMOVE THE CREATOR OF THIS PROJECT FROM ADMINS LIST");
            return
        }
        if(email == userEmail){
            window.alert("ADMIN CANT KICK HIMSELF");
            return
        }
        //retrivingg the doc from the database and deleting it
        const docReference = doc(db,"admins",email);
        const data = await getDoc(docReference);
        //if the requesting doc exists...
        if(data.data()){
            deleteDoc(docReference);
            window.alert(`${data.data().displayName} IS NO LONGER AN ADMIN`);
            flag2 = 1;
        }
        //if it doesnt...
        else{
            window.alert("USER IS NOT AN ADMIN");
        }
    }
    catch(err){
        window.alert("AN ERROR OCCURED, PLEASE TRY AGAIN");
        window.alert(err);
    }
    removeAdminForm.reset();
})
let flag2 = 1;
viewAddedAndRemovedButtonAdmin.addEventListener("click",async() => {
    if(flag2){
        try{
            //retriving the snapshot of the table
            const snapshot = await getDocs(updatedAdminsCollectionReference);
            for(let i=0;i<snapshot.docs.length;i++){
                //retriving the data for each criminal
                const adminDetails = snapshot.docs[i].data();
                const data = [adminDetails.displayName,
                    adminDetails.email,
                    adminDetails.addedBy,
                    adminDetails.dateAdded,
                    adminDetails.removedBy,
                    adminDetails.dateRemoved]
                const td = [];
                const tr = document.createElement("tr");
                for(let j=0;j<6;j++){
                    const temptd = document.createElement("td");
                    temptd.innerText = data[j];
                    tr.appendChild(temptd);
                }
                adminsTable.appendChild(tr);
            }
            flag2 = 0;  //this flag is used to prevent loading until next change is made in the table
        }
        catch(err){
            window.alert("AN ERROR OCCURED, PLEASE TRY AGAIN");
            window.alert(err);
        }
    }
})
displayAllCriminals.addEventListener("click",async () => {
    try{
        //This will display all criminals in the find criminals section
        resultsDiv.innerHTML = "";  //clearing the previous results before displaying it again
        const listReference = ref(storage,"criminals");
        const res = await list(listReference);
        res.items.forEach(async (itemRef) => {
            const nameOfTheCriminal = itemRef._location.path.slice(10); //retriving the name of the criminal from the path name
            createCriminalCard(itemRef,nameOfTheCriminal);  //function to display the criminal details in resultsDiv
        });
    }
    catch(err){
        let errCode = err.code;
        let errorMessage = err.message;
    }
})
searchForm.addEventListener("submit",async (e) => {
    try{
        e.preventDefault();
        resultsDiv.innerHTML = "";
        const displayNameBefore = searchForm.criminalName.value;
        const displayName = makeStr(displayNameBefore);
        const listReference = ref(storage,"criminals"); //firebase function to get the list reference of the criminals
        const res = await list(listReference);
        res.items.forEach(async (itemRef) => {
            const nameOfTheCriminal = itemRef._location.path.slice(10); //retriving the name of the criminal from the path name
            if(nameOfTheCriminal.includes(displayName)){
                createCriminalCard(itemRef,nameOfTheCriminal);  //function to display the criminal details in resultsDiv
            }
        });
    }
    catch(err){
        let errCode = err.code;
        let errorMessage = err.message;
        console.log(errCode);
        console.log(errorMessage);
    }
    searchForm.reset();
})
onAuthStateChanged(auth,async (user) => {
    try{
        //If the user exists
        if(user){
            if(user.emailVerified == true){
                user.providerData.forEach((profile) => {
                    userDisplayName = profile.displayName;
                    userEmail  = profile.email;
                    userphotoURL =  profile.photoURL;
                });
                showProfile();
                const docReference = await doc(db,"admins",userEmail);    //checking whether the user is an admin or not
                const data = await getDoc(docReference);
                if(data.data()){    //if he is an admin show the admin block which contains options for managing criminals and other admins
                    for(let i=0;i<adminButtons.length;i++){
                        adminButtons[i].style.display = "block";
                    }
                    findAdminsButton.style.display = "none";
                }
                div5.style.display = "none";
                menuIcon.style.display = "inline-block";
            }
        }
        //if user doesnt exist, redirect the user to loginpage
        else{
            window.location.href = "../index.html";
        }}
    catch(err){
        window.alert("AUTHENTICATION ERROR");
        window.alert(err);
    }
})