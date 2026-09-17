/* ==========================================================
   Configuração do Firebase
   Substitua os valores abaixo pelas chaves do SEU projeto Firebase.
   Onde encontrar: Console do Firebase > ⚙️ Configurações do projeto
   > "Seus apps" > ícone Web (</>) > "Configuração do SDK"
   ========================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyBI0pXj34GYSKj8O03VQfROtbOyJ1eBJh0",
  authDomain: "prontuario-pet.firebaseapp.com",
  projectId: "prontuario-pet",
  storageBucket: "prontuario-pet.firebasestorage.app",
  messagingSenderId: "702794633884",
  appId: "1:702794633884:web:66dfca1bb13500d79a1359"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
