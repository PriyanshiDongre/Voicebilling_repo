import { auth, db } from "../backend/firebase.js";
import {
    collection,
    addDoc,
    getDocs,
    serverTimestamp,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

// ================= CONFIG =================
const GEMINI_API_KEY = "AIzaSyAFUKQ1XRB7lcK3gkIpWMRwbXfcchdggzY";

// ================= UI ELEMENTS =================
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const output = document.getElementById("output");
const langSelect = document.getElementById("language");

// ================= URL PARAM =================
const urlParams = new URLSearchParams(window.location.search);
const shopId = urlParams.get("shopId");

if (!shopId) {
    alert("Shop not selected. Redirecting to dashboard.");
    window.location.href = "dashboard.html";
}

// ================= STATE =================
let mode = "add"; // add | bill
let recognition;
let finalTranscript = "";

// ================= LANGUAGE MAP =================
const langMap = {
    English: "en-IN",
    Hindi: "hi-IN",
    Marathi: "mr-IN"
};

// ================= INIT SPEECH =================
const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;

// ================= BUTTON MODES =================
const addBtn = document.getElementById("addMode");
const billBtn = document.getElementById("billMode");

if (!addBtn || !billBtn) {
    console.warn("Mode buttons not found in HTML");
} else {
    addBtn.onclick = () => {
        mode = "add";
        speak("Add data mode activated");
    };

    billBtn.onclick = () => {
        mode = "bill";
        speak("Billing mode activated");
    };
}


// ================= START MIC =================
micBtn.onclick = () => {
    finalTranscript = "";
    output.innerText = "Listening...";
    recognition.lang = langMap[langSelect.value] || "en-IN";
    recognition.start();
};

// ================= STOP MIC =================
stopBtn.onclick = async () => {
    recognition.stop();
    output.innerText = "Processing...";
    await processSpeech(finalTranscript);
};

// ================= SPEECH EVENTS =================
recognition.onresult = event => {
    let transcript = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
    }

    finalTranscript = transcript.trim();
    output.innerText = finalTranscript;
};

recognition.onerror = e => {
    console.error("Mic error:", e);
    output.innerText = "Microphone error";
};

// ================= GEMINI AI =================
async function askGemini(prompt) {
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        }
    );

    if (!res.ok) throw new Error("Gemini API failed");

    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
}

// ================= PROCESS SPEECH =================
async function processSpeech(text) {
    if (!text) {
        speak("No voice detected");
        return;
    }

    try {
        if (mode === "add") {
            await handleAddProduct(text);
        } else {
            await handleBilling(text);
        }
    } catch (err) {
        console.error(err);
        speak("Error processing request");
    }
}

// ================= ADD PRODUCT =================
async function handleAddProduct(text) {
    const prompt = `
Convert this shopkeeper speech into JSON:

"${text}"

Return ONLY JSON in this format:
{
  "name": "",
  "price": number,
  "unit": "",
  "category": ""
}
`;

    const aiResponse = await askGemini(prompt);
    const data = JSON.parse(aiResponse);

    await addDoc(collection(db, "items", shopId, "products"), {
        name: data.name,
        price: Number(data.price),
        unit: data.unit,
        category: data.category,
        active: true,
        createdAt: serverTimestamp()
    });

    speak(`${data.name} added successfully`);
    output.innerText = `Saved: ${data.name} - ₹${data.price}`;
}

// ================= BILLING =================
async function handleBilling(text) {
    const prompt = `
Extract billing info from this sentence:

"${text}"

Return ONLY JSON:
{
  "items": [
    { "name": "", "quantity": number }
  ]
}
`;

    const aiResponse = await askGemini(prompt);
    const billData = JSON.parse(aiResponse);

    let total = 0;
    let receiptItems = [];

    for (const item of billData.items) {
        const q = query(
            collection(db, "items", shopId, "products"),
            where("name", "==", item.name)
        );

        const snap = await getDocs(q);

        snap.forEach(doc => {
            const data = doc.data();
            const cost = data.price * item.quantity;

            total += cost;

            receiptItems.push({
                name: item.name,
                quantity: item.quantity,
                price: data.price,
                total: cost
            });
        });
    }

    // ================= SAVE RECEIPT =================
    await addDoc(collection(db, "bills", shopId, "receipts"), {
        items: receiptItems,
        total,
        createdAt: serverTimestamp()
    });

    speak(`Your total bill is ${total} rupees`);
    output.innerText = `TOTAL: ₹${total}`;
}

// ================= TEXT TO SPEECH =================
function speak(text) {
    const msg = new SpeechSynthesisUtterance();
    msg.text = text;

    if (langSelect.value === "Hindi") msg.lang = "hi-IN";
    else if (langSelect.value === "Marathi") msg.lang = "mr-IN";
    else msg.lang = "en-IN";

    speechSynthesis.speak(msg);
}
