/* ==========================================================
   Compasso da Banda — credenciais do projeto banda-exodo.
   Este arquivo já está preenchido. Basta colocá-lo dentro da
   pasta "public" do projeto, substituindo o config.js antigo.
   ========================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyAdiH3RLSKNivfRQxuJL9WaG6gWeChyHig",
  authDomain: "banda-exodo.firebaseapp.com",
  projectId: "banda-exodo",
  storageBucket: "banda-exodo.firebasestorage.app",
  messagingSenderId: "526461803908",
  appId: "1:526461803908:web:729e92b483bfab1fb011d1",
  measurementId: "G-9DX1KYKY50"
};

/* ==========================================================
   QUEM ADMINISTRA
   Escreva abaixo os e-mails que podem cadastrar, editar e apagar.
   Todos os outros entram com a conta deles e só acompanham.
   Os mesmos e-mails precisam estar no arquivo firestore.rules.
   ========================================================== */
const administradores = [
  "jvmpr.adm@gmail.com"
];

/* ==========================================================
   QUEM CUIDA SÓ DA AGENDA
   Estes e-mails marcam, editam e apagam compromissos, e montam
   o repertório e a escala de cada um. Não mexem no catálogo de
   músicas nem no cadastro da banda.
   Os mesmos e-mails precisam estar no arquivo firestore.rules.
   ========================================================== */
const agenda = [
  /* vazio: ninguém tem esse papel hoje.
     Para dar a alguém o controle só da agenda, escreva o e-mail
     entre aspas nesta lista e some o mesmo e-mail no firestore.rules. */
];

/* ============ daqui para baixo não mexa ============ */
window.CONFIG = { firebase: firebaseConfig, administradores: administradores, agenda: agenda };
