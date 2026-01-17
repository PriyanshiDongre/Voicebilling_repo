// auth.js
import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

export async function loginUser(email, password) {
    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCred.user.uid;

    const userSnap = await getDoc(doc(db, "users", uid));

    return { uid, isRegistered: userSnap.exists(), userData: userSnap.data() || null };
}
