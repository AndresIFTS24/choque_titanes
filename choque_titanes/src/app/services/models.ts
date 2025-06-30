export interface SETEO  {
  nick: string;
  icono: number; //indice del icono
  color: string; // HEX del color
}

export interface POS {
  lat: number;
  long: number;
}

export interface JUGADOR {
  seteo: SETEO;
  POS: POS;
  PUNTOS: number;
}

export interface BALL {
  OWNER: string; //UID que genero la bola
  lat: number;
  long: number;
}
