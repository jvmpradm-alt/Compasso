/* Ponte entre o app e o Firebase.
   Voce nao precisa editar este arquivo: tudo o que muda fica em config.js */
const SDK = "https://www.gstatic.com/firebasejs/12.18.0/";
const C = window.CONFIG || {};
const lista = k => (C[k] || []).map(e => String(e).trim().toLowerCase()).filter(Boolean);
const admins = lista("administradores");
const agendistas = lista("agenda");
const tempistas  = lista("tempos");
let usuario = null, ouvintes = [], pronto = false;

/* Administrador = conta de e-mail listada em config.js.
   Integrante    = abre o link e pronto, sem cadastro: entra de forma
                   anonima e so le. A mesma separacao vale no servidor,
                   em firestore.rules.                                 */
/* admin   = mexe em tudo
   agenda  = marca e edita compromissos, monta repertorio e escala deles
   tempo   = acompanha tudo e ajusta so o BPM dos hinos (a bateria)
   leitura = so acompanha, e pode sugerir hinos                        */
function papel(u){
  if(!u || u.isAnonymous || !u.email) return "leitura";
  const e = String(u.email).toLowerCase();
  if(admins.indexOf(e) >= 0) return "admin";
  if(agendistas.indexOf(e) >= 0) return "agenda";
  if(tempistas.indexOf(e) >= 0) return "tempo";
  return "leitura";
}
function ehAdmin(u){ return papel(u) === "admin"; }
function avisar(){ ouvintes.forEach(f => { try{ f(usuario); }catch(e){} }); }
function configurado(){
  const f = C.firebase || {};
  return !!(f.apiKey && f.projectId && String(f.apiKey).indexOf("COLE_") < 0);
}

(async function(){
  if(!configurado()){ window.BANDA = { erro:"config" }; return; }
  try{
    const [{ initializeApp },
           { getAuth, onAuthStateChanged, signInAnonymously, signInWithEmailAndPassword,
             createUserWithEmailAndPassword, sendPasswordResetEmail, signOut },
           { getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc }] = await Promise.all([
      import(SDK + "firebase-app.js"),
      import(SDK + "firebase-auth.js"),
      import(SDK + "firebase-firestore.js")
    ]);

    const app  = initializeApp(C.firebase);
    const fdb  = getFirestore(app);
    const auth = getAuth(app);

    const refDoc = caminho => ({
      set(dados){ return setDoc(doc(fdb, caminho), dados); },
      delete(){ return deleteDoc(doc(fdb, caminho)); },
      onSnapshot(prox, erro){
        return onSnapshot(doc(fdb, caminho),
          s => prox({ id:s.id, exists:s.exists(), data:()=>s.data() }),
          e => erro && erro(e));
      }
    });

    window.BANDA = {
      db: {
        doc: refDoc,
        collection(caminho){
          return {
            doc(id){ return refDoc(caminho + "/" + id); },
            onSnapshot(prox, erro){
              return onSnapshot(collection(fdb, caminho),
                s => prox({ docs: s.docs.map(d => ({ id:d.id, exists:true, data:()=>d.data() })) }),
                e => erro && erro(e));
            }
          };
        }
      },
      usuario: () => usuario,
      ehAdmin: () => ehAdmin(usuario),
      papel: () => papel(usuario),
      entrar:   (email, senha) => signInWithEmailAndPassword(auth, String(email||"").trim(), senha),
      criar:    (email, senha) => createUserWithEmailAndPassword(auth, String(email||"").trim(), senha),
      recuperar:(email)        => sendPasswordResetEmail(auth, String(email||"").trim()),
      sair: async () => { await signOut(auth); try{ await signInAnonymously(auth); }catch(e){} },
      onUser(fn){ ouvintes.push(fn); if(pronto) fn(usuario); }
    };

    onAuthStateChanged(auth, u => {
      pronto = true;
      if(!u){
        // Integrante: entra sozinho, sem cadastro, e so le.
        signInAnonymously(auth).catch(() => { usuario = null; avisar(); });
        return;
      }
      usuario = u; avisar();
    });
  }catch(e){
    window.BANDA = { erro: String((e && e.message) || e) };
  }
})().finally(() => window.dispatchEvent(new Event("banda-pronto")));
