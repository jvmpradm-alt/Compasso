/* Ponte entre o app e o Firebase.
   Voce nao precisa editar este arquivo: tudo o que muda fica em config.js */
const SDK = "https://www.gstatic.com/firebasejs/12.18.0/";
const C = window.CONFIG || {};
const admins = (C.administradores || []).map(e => String(e).trim().toLowerCase()).filter(Boolean);
let usuario = null, ouvintes = [], pronto = false;

function ehAdmin(u){
  return !!(u && !u.isAnonymous && u.email && admins.indexOf(String(u.email).toLowerCase()) >= 0);
}
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
      entrar:   (email, senha) => signInWithEmailAndPassword(auth, String(email||"").trim(), senha),
      criar:    (email, senha) => createUserWithEmailAndPassword(auth, String(email||"").trim(), senha),
      recuperar:(email)        => sendPasswordResetEmail(auth, String(email||"").trim()),
      sair: async () => { await signOut(auth); try{ await signInAnonymously(auth); }catch(e){} },
      onUser(fn){ ouvintes.push(fn); if(pronto) fn(usuario); }
    };

    onAuthStateChanged(auth, u => {
      pronto = true;
      if(!u){
        signInAnonymously(auth).catch(() => { usuario = null; avisar(); });
        return;
      }
      usuario = u; avisar();
    });
  }catch(e){
    window.BANDA = { erro: String((e && e.message) || e) };
  }
})().finally(() => window.dispatchEvent(new Event("banda-pronto")));
