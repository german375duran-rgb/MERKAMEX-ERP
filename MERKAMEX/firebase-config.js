// Configuración de Firebase para MERKAMEX ERP
const firebaseConfig = {
    apiKey: "AIzaSyCSOTdAPkvr5bShK0g03yj_loAH7plubKs",
    authDomain: "merkamex-erp.firebaseapp.com",
    projectId: "merkamex-erp",
    storageBucket: "merkamex-erp.firebasestorage.app",
    messagingSenderId: "135299537373",
    appId: "1:135299537373:web:a403a52e31f65b79ea3e34",
    measurementId: "G-H4DBGVW9XK"
};

// Inicializar Firebase (usando la versión compat para mayor facilidad con el código actual)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log("🔥 Firebase conectado exitosamente a MERKAMEX ERP");
