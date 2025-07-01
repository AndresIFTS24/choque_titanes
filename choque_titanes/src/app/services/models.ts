export interface seteo  {
  nick: string;
  icono: number; //indice del icono
  color: string; // HEX del color
}

export interface pos {
  lat: number;
  long: number;
}

export interface jugador {
  seteo: seteo;
  pos: pos;
  puntos: number;
}

export interface ball {
  owner: string; //UID que genero la bola
  lat: number;
  long: number;
}
