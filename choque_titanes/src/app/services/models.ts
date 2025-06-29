export interface SETEO {
  Nick: string;
  Icono: number; //indice del icono
  Color: string; // HEX del color
}

export interface POS {
  lat: number;
  long: number;
}

export interface JUGADOR {
  SETEO: SETEO;
  POS: POS;
  PUNTOS: number;
}

export interface BALL {
  OWNER: string; //UID que genero la bola
  lat: number;
  long: number;
}