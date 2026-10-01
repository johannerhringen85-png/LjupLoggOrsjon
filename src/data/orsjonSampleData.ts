import { DepthPoint, LakePreset } from '../types';

export const ORSJON_PRESETS: LakePreset[] = [
  {
    name: 'Hela Orsjön',
    lat: 56.2805,
    lng: 14.5020,
    zoom: 14,
    description: 'Översikt över hela sjön och alla lodningszoner'
  },
  {
    name: 'Djupgraven (Centrum)',
    lat: 56.2812,
    lng: 14.5015,
    zoom: 16,
    description: 'Sjöns djupaste bottenhåla, upp till 12m+'
  },
  {
    name: 'Norra viken & Vasskanten',
    lat: 56.2860,
    lng: 14.5030,
    zoom: 15,
    description: 'Grunt lekområde för gädda och abborre (1-3m)'
  },
  {
    name: 'Östra branten',
    lat: 56.2800,
    lng: 14.5110,
    zoom: 16,
    description: 'Snabb brant från 2m ner till 8m på kort avstånd'
  },
  {
    name: 'Södra sundet & Udden',
    lat: 56.2750,
    lng: 14.4970,
    zoom: 15,
    description: 'Genomströmningszon med hård botten och stenpartier'
  }
];

export const INITIAL_ORSJON_DATA: DepthPoint[] = [
  // Norra viken (grunt: 1-2.5m)
  {
    id: 'orsjon-1',
    lat: 56.2868,
    lng: 14.5035,
    seconds: 1.8,
    weight_g: 20,
    date: '2026-05-18',
    time: '08:15',
    note: 'Norra viken innerst - näckrosbälte och gyttjebotten'
  },
  {
    id: 'orsjon-2',
    lat: 56.2858,
    lng: 14.5042,
    seconds: 2.4,
    weight_g: 20,
    date: '2026-05-18',
    time: '08:24',
    note: 'Vasskanten norr - fin gäddkant'
  },
  {
    id: 'orsjon-3',
    lat: 56.2850,
    lng: 14.5018,
    seconds: 3.1,
    weight_g: 25,
    date: '2026-05-18',
    time: '08:35',
    note: 'Övergång från grundområde till slänt'
  },
  {
    id: 'orsjon-4',
    lat: 56.2842,
    lng: 14.5055,
    seconds: 3.6,
    weight_g: 20,
    date: '2026-05-18',
    time: '08:48',
    note: 'Nordost-platån - 3m kurva'
  },

  // Centrala sjön & Djupgraven (6-12m)
  {
    id: 'orsjon-5',
    lat: 56.2830,
    lng: 14.5028,
    seconds: 7.2,
    weight_g: 20,
    date: '2026-05-18',
    time: '09:05',
    note: 'Nordbranten mot djupet'
  },
  {
    id: 'orsjon-6',
    lat: 56.2820,
    lng: 14.5018,
    seconds: 11.5,
    weight_g: 20,
    date: '2026-05-18',
    time: '09:20',
    note: 'Djupgravens centrum - mjuk sedimentbotten'
  },
  {
    id: 'orsjon-7',
    lat: 56.2815,
    lng: 14.5010,
    seconds: 13.8,
    weight_g: 20,
    date: '2026-05-18',
    time: '09:35',
    note: 'Sjöns djupaste punkt - pelagisk zon'
  },
  {
    id: 'orsjon-8',
    lat: 56.2810,
    lng: 14.5022,
    seconds: 12.1,
    weight_g: 25,
    date: '2026-05-18',
    time: '09:50',
    note: 'Djupgrav östra delen'
  },
  {
    id: 'orsjon-9',
    lat: 56.2802,
    lng: 14.5005,
    seconds: 9.8,
    weight_g: 20,
    date: '2026-05-18',
    time: '10:05',
    note: 'Djupgrav sydväst - brant stigning mot grundet'
  },

  // Östra sidan & branten (3-8m)
  {
    id: 'orsjon-10',
    lat: 56.2825,
    lng: 14.5075,
    seconds: 5.4,
    weight_g: 20,
    date: '2026-05-19',
    time: '13:10',
    note: 'Östra slänten mot djupet'
  },
  {
    id: 'orsjon-11',
    lat: 56.2818,
    lng: 14.5098,
    seconds: 3.2,
    weight_g: 15,
    date: '2026-05-19',
    time: '13:25',
    note: 'Östra grundhyllan utanför berget'
  },
  {
    id: 'orsjon-12',
    lat: 56.2805,
    lng: 14.5115,
    seconds: 2.1,
    weight_g: 20,
    date: '2026-05-19',
    time: '13:40',
    note: 'Östra stranden, stenig botten'
  },
  {
    id: 'orsjon-13',
    lat: 56.2795,
    lng: 14.5085,
    seconds: 6.8,
    weight_g: 30,
    date: '2026-05-19',
    time: '14:00',
    note: 'Östra branten rasbrant med storsten'
  },

  // Västra sidan & udden (2-6m)
  {
    id: 'orsjon-14',
    lat: 56.2828,
    lng: 14.4965,
    seconds: 2.8,
    weight_g: 20,
    date: '2026-05-20',
    time: '15:15',
    note: 'Västra viken - sandblandad dy'
  },
  {
    id: 'orsjon-15',
    lat: 56.2815,
    lng: 14.4960,
    seconds: 4.2,
    weight_g: 20,
    date: '2026-05-20',
    time: '15:30',
    note: 'Västra platån 3.5m'
  },
  {
    id: 'orsjon-16',
    lat: 56.2808,
    lng: 14.4982,
    seconds: 7.5,
    weight_g: 20,
    date: '2026-05-20',
    time: '15:45',
    note: 'Från västplatån stupar botten mot djupet'
  },
  {
    id: 'orsjon-17',
    lat: 56.2798,
    lng: 14.4952,
    seconds: 1.9,
    weight_g: 15,
    date: '2026-05-20',
    time: '16:00',
    note: 'Grynna / stenparti vid västra udden'
  },

  // Södra bassängen & utlopp (3-7m)
  {
    id: 'orsjon-18',
    lat: 56.2785,
    lng: 14.5012,
    seconds: 8.4,
    weight_g: 20,
    date: '2026-05-21',
    time: '10:15',
    note: 'Södra mittpartiet, jämn 6-7m botten'
  },
  {
    id: 'orsjon-19',
    lat: 56.2772,
    lng: 14.5028,
    seconds: 6.9,
    weight_g: 25,
    date: '2026-05-21',
    time: '10:35',
    note: 'Sydöstra bassängen'
  },
  {
    id: 'orsjon-20',
    lat: 56.2760,
    lng: 14.4998,
    seconds: 4.8,
    weight_g: 20,
    date: '2026-05-21',
    time: '10:55',
    note: 'Avsmalnande mot södra viken'
  },
  {
    id: 'orsjon-21',
    lat: 56.2745,
    lng: 14.4975,
    seconds: 2.6,
    weight_g: 20,
    date: '2026-05-21',
    time: '11:15',
    note: 'Södra sundet / utloppet mot ån'
  },
  {
    id: 'orsjon-22',
    lat: 56.2738,
    lng: 14.4955,
    seconds: 1.5,
    weight_g: 15,
    date: '2026-05-21',
    time: '11:30',
    note: 'Södra viken strandremsa'
  },

  // Kompletterande lodningspunkter för tätare bathymetri
  {
    id: 'orsjon-23',
    lat: 56.2840,
    lng: 14.4995,
    seconds: 4.5,
    weight_g: 20,
    date: '2026-05-22',
    time: '17:10',
    note: 'Nordvästra slänten'
  },
  {
    id: 'orsjon-24',
    lat: 56.2822,
    lng: 14.5050,
    seconds: 8.9,
    weight_g: 20,
    date: '2026-05-22',
    time: '17:25',
    note: 'Mellan centralhålan och östra branten'
  },
  {
    id: 'orsjon-25',
    lat: 56.2790,
    lng: 14.5055,
    seconds: 5.7,
    weight_g: 20,
    date: '2026-05-22',
    time: '17:40',
    note: 'Sydöstra platåkanten'
  },
  {
    id: 'orsjon-26',
    lat: 56.2780,
    lng: 14.4970,
    seconds: 3.4,
    weight_g: 20,
    date: '2026-05-22',
    time: '17:55',
    note: 'Sydvästra bukten'
  }
];
