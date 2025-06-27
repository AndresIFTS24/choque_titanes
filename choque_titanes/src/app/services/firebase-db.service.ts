import { Injectable } from '@angular/core';
import { Database, ref, set, get,  update, remove, push,onDisconnect, onChildAdded, onChildRemoved, onChildChanged } from '@angular/fire/database';
import { JUGADOR, BALL } from './models';  // Ajustá la ruta según corresponda





@Injectable({ providedIn: 'root' })
export class FirebaseDbService {
    // Jugador actual conectado (único)
  jugadorActual: JUGADOR | null = null; // null si no hay jugador local conectado

  // Lista de jugadores conectados
  listaJugadores: Map<string, JUGADOR> = new Map();

  // Lista de balls en el mapa
  listaBalls: Map<string, BALL> = new Map();

  constructor(private db: Database) {}
  //XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  //            GENERAL
  //XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  Conectar_al_Mapa(){
    //Cuando se verifico en el loguin que el usuario es correcto y tiene configuración visual, se debe cambiar al MAPA
    //El mapa al iniciar debe llamar a este método, el cual le dara los usuarios y pelotas a dibujar
    //En adicional, fuera de este método, el mapa debe dibujar al jugador principal
    
    this.setOnline("PONER_ID_AUTH_LOGIN");
    this.subscribeToOnlineUsers();
    this.subscribeToBalls();

  }
  //XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  //            MANJEO DEL NODO ONLINE
  //XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

  setOnline(uid: string) {    
    const userRef = ref(this.db, `ONLINE/${uid}`);
    // Configura que al desconectarse, se borre el valor de online si lo tienen o lo tuviera
    onDisconnect(userRef).remove();
    // Luego devuelve la promesa de escritura de 1
    return set(userRef, 1);
  }

  removeOnline(uid: string) {
    //Es útil si me quiero desconectar manualmente, ya que automáticamente esta el OnDisconect del servidor al que me suscribi al ponerme Online
    return remove(ref(this.db, `ONLINE/${uid}`));
  }

  subscribeToOnlineUsers() {
    const onlineRef = ref(this.db, 'ONLINE');

    // Detecta cuando alguien se conecta
    onChildAdded(onlineRef, (snapshot) => {
      const uid = snapshot.key!;
      const value = snapshot.val();

      // Si no existe, lo agregamos a listaJugadores
      if (!this.listaJugadores.has(uid)) {
        const jugadorBasico: JUGADOR = {
          SETEO: { Nick: '', Icono: 0, Color: '#000000' },  // valores por defecto a cargar en otro método
          POS: { lat: 0, long: 0 },
          PUNTOS: 0
        };
        this.listaJugadores.set(uid, jugadorBasico);
        console.log(`🟢 Usuario conectado agregado a listaJugadores: ${uid}`);
        this.cargarPerfil_Online(uid);//Como tiene los datos vacios, los pido la primera vez
      }
    });

    // Detecta cuando alguien se desconecta
    onChildRemoved(onlineRef, (snapshot) => {
      const uid = snapshot.key!;
      if (this.listaJugadores.has(uid)) {
        this.listaJugadores.delete(uid);
        //Aca debe borrar gráficamente si existe al jugador online que se desconecto del mapa
        //!!Tengo que ver como borrar la suscripción de ese usuario desconectado, no me debería afectar, salvo que se reconecte que duplicaría la suscripcion

        console.log(`🔴 Usuario desconectado eliminado de listaJugadores: ${uid}`);
      }
    });
  }

  //XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  //            MANJEO DEL NODO PERFIL
  //XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  setConfig(uid: string, nick: string, icono: number, color: string) {
    //Debe llamarse cuando cambia la apariencia gráfica solo del propio jugador, o cuando se inicia por primera vez
    // o todas las veces que confirma y es correcto
    return set(ref(this.db, `PERFILES/${uid}/seteo`), {
      nick,
      icono,
      color
    });
  }

  setPosicion(uid: string, lat: number, long: number) {
    //Debe llamarse cuando cambia la coordenada solo del propio jugador
    return set(ref(this.db, `PERFILES/${uid}/pos`), {
      lat,
      long
    });
  }

  setPuntos(uid: string, puntos: number) {
    //Debe llamarse cuando cambian los puntos solo del propio jugador
    return set(ref(this.db, `PERFILES/${uid}/puntos`), puntos);
  }

  cargarPerfil_Online(uid: string) {
    //Se llama una vez al principio por cada usuario ONLINE
    const perfilRef = ref(this.db, `PERFILES/${uid}`);
      get(perfilRef).then((snapshot) => {
        if (snapshot.exists()) {
          const datos: JUGADOR = snapshot.val();

          this.listaJugadores.set(uid, datos);
          console.log(`✅ Perfil de ${uid} cargado:`, datos);
          //Aca debe crear por primera vez al Jugador online visualmente
          this.subscribeToPerfilChanges(uid);//Con la primera captura de datos, me suscribo a los cambios de los mismos
          

        } else {
          console.warn(`⚠️ No se encontró perfil para ${uid}`);
        }
      }).catch((error) => {
        console.error(`❌ Error al cargar perfil de ${uid}:`, error);
    });
  }

  subscribeToPerfilChanges(uid: string) {
    //Se llama una vez por usuario online luego de tener sus datos iniciales
    const perfilRef = ref(this.db, `PERFILES/${uid}`);

    onChildChanged(perfilRef, (snapshot) => {
      const propiedad = snapshot.key!;
      const nuevoValor = snapshot.val();

      const jugador = this.listaJugadores.get(uid);

      if (!jugador) {
        console.warn(`Jugador ${uid} no encontrado en listaJugadores`);
        return;
      }

      switch (propiedad) {
        case 'SETEO':
          jugador.SETEO = nuevoValor;
          console.log(`SETEO actualizado para ${uid}:`, nuevoValor);
          //Llamar a modificar visualmente al jugador online
          break;

        case 'POS':
          jugador.POS = nuevoValor;
          console.log(`POS actualizado para ${uid}:`, nuevoValor);
          //Llamar a modificar POS del mapa del jugador online
          break;

        case 'PUNTOS':
          jugador.PUNTOS = nuevoValor;
          console.log(`PUNTOS actualizado para ${uid}:`, nuevoValor);
          //Que hacemos con los puntos de los jugadores conectados? los ponemos tambien en el maapa alado del numbre?
          break;

        default:
          console.log(`Propiedad no manejada (${propiedad}) para ${uid}:`, nuevoValor);
          //Esto no debería ocurrir
          break;
      }

      // Guardamos el jugador actualizado en el Map
      this.listaJugadores.set(uid, jugador);
    });
  }
  //XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  //            MANJEO DEL NODO BALLS
  //XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
  crearBall(uid: string, lat: number, long: number) {
    const ballRef = push(ref(this.db, 'BALLS'));
    return set(ballRef, {
      owner: uid,
      lat,
      long
    });
  }

  eliminarBall(ballId: string) {
    return remove(ref(this.db, `BALLS/${ballId}`));
  }

  subscribeToBalls() {
    const ballsRef = ref(this.db, 'BALLS');

    // Detecta nuevas BALLS
    onChildAdded(ballsRef, (snapshot) => {
      const id = snapshot.key!;
      const ballData = snapshot.val();

      if (ballData && ballData.lat !== undefined && ballData.long !== undefined && ballData.OWNER) {
        this.listaBalls.set(id, ballData);
        console.log(`🟢 BALL agregada [${id}]:`, ballData);
        //Aca debería agregar la pelota gráficamente al mapa
      } else {
        console.warn(`⚠️ BALL inválida ignorada:`, ballData);
      }

      
    });

    // Detecta BALLS borradas
    onChildRemoved(ballsRef, (snapshot) => {
      const id = snapshot.key!;
      if (this.listaBalls.has(id)) {

        //Aca debería borrar gráficamente la pelota del mapa
        this.listaBalls.delete(id);
        console.log(`🔴 BALL eliminada [${id}]`);
      }
      
    });
  }

}
