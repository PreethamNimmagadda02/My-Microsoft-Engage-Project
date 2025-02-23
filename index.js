import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js";
import {
    getAuth,createUserWithEmailAndPassword,
    signInWithEmailAndPassword,sendEmailVerification,
    sendPasswordResetEmail,updateProfile,signOut
} from "https://www.gstatic.com/firebasejs/9.8.1/firebase-auth.js";
import {
    getStorage,ref,uploadBytes
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
const app = initializeApp(firebaseConfig);
const storage = getStorage();
const auth = getAuth(app);

const signInForm = document.getElementById("signInForm");
const signUpForm = document.getElementById("signUpForm");
const imageUpload = document.getElementById("imageUpload");
const closeButton = document.getElementById("closeButton");
const forgotPasswordDiv = document.getElementById("forgotPasswordDiv");
const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const forgotPasswordButton = document.getElementById("forgotPasswordButton");

signInForm.addEventListener("submit", async (e) => {                                //This callback function triggers when user submits signup form
    try{
        e.preventDefault();
        const email = signInForm.email.value;
        const password = signInForm.password.value;
        await signInWithEmailAndPassword(auth,email,password);                      //Firebase function for signIn
        if(auth.currentUser.emailVerified){
            window.location.href = "/HTML FILES/home.html";
        }
        else{
            window.alert("USER IS NOT VERIFIED\nTRY THESE :\n1. If you already have an account check your email for verification link.\n2. Create a new account.");
            await signOut(auth);
        }
    }
    catch(err){
        window.alert("INVALID EMAIL OR PASSWORD");
    }
    signInForm.reset();
})
signUpForm.addEventListener("submit", async (e) => {                                //This callback function triggers when user submits signup form
    try{
        e.preventDefault();
        const displayName = signUpForm.displayName.value;
        const email = signUpForm.email.value;
        const password = signUpForm.password.value;
        let file = imageUpload.files[0];
        if(file){
            const storageRef = ref(storage,"users/" + `${displayName}`);            //uploading the image to storage
            await uploadBytes(storageRef,file);
        }
        await createUserWithEmailAndPassword(auth,email,password)
        await sendEmailVerification(auth.currentUser);
        //updating the details of the user if there is no profile picture submitted then url of default pic is used as photoURL of the user
        if(file){
            await updateProfile(auth.currentUser,{displayName: displayName,photoURL:"users/" + `${displayName}`});
        }
        else{
            await updateProfile(auth.currentUser,{displayName: displayName,photoURL:"users/user.jpg"});
        }
        window.alert("VERIFICATION LINK SENT SUCCESSFULLY.\n PLEASE CHECK YOUR E-MAIL.");
    }
    catch{
        window.alert("AN ERROR OCCURRED PLEASE TRY AGAIN LATER");
        window.alert(err);
    }
    signUpForm.reset();
})
forgotPasswordForm.addEventListener("submit", async (e) => {                    //This callback function triggers when user submits signup form
    try{
        e.preventDefault();
        const email = forgotPasswordForm.email.value;
        await sendPasswordResetEmail(auth,email)                                //Firebase function to send password reset email
        window.alert("PASSWORD RESET EMAIL SENT SUCCESSFULLY");
    }
    catch(err){
        window.alert("FAILED TO SEND A MAIL TO RESET YOUR PASSWORD");
        window.alert(err);
    }
    forgotPasswordForm.reset();
})
forgotPasswordButton.addEventListener("click",() => {
    forgotPasswordDiv.style.display = "block";                                  //Form pops up then forgot password button is clicked
})
closeButton.addEventListener("click",() => {
    forgotPasswordDiv.style.display = "none";                                   //Close button closes the forgotPasswordForm 
})