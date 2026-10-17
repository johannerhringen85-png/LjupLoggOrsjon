import { FishCatch } from '../types';

export const INITIAL_ORSJON_CATCHES: FishCatch[] = [
  {
    id: 'catch-1',
    lat: 56.2818,
    lng: 14.5090,
    species: 'Abborre',
    length_cm: 39,
    weight_kg: 0.82,
    depth_m: 5.4,
    date: '2026-05-20',
    time: '14:45',
    lure: 'Dropshot med kräftjigg (Motoröl)',
    note: 'Tog precis i slutet av branten mot djupet'
  },
  {
    id: 'catch-2',
    lat: 56.2858,
    lng: 14.5038,
    species: 'Gädda',
    length_cm: 86,
    weight_kg: 4.8,
    depth_m: 2.3,
    date: '2026-05-21',
    time: '09:15',
    lure: 'Shadjigg 18cm (Gäddfärg)',
    note: 'Vasskanten norr vid näckrosbältet'
  },
  {
    id: 'catch-3',
    lat: 56.2812,
    lng: 14.5020,
    species: 'Gös',
    length_cm: 62,
    weight_kg: 2.65,
    depth_m: 8.8,
    date: '2026-05-22',
    time: '20:30',
    lure: 'Vertikaljigg (Chartreuse/Vit)',
    note: 'Pelagiskt ekolodseko över centrala bottenhålan'
  },
  {
    id: 'catch-4',
    lat: 56.2802,
    lng: 14.4980,
    species: 'Abborre',
    length_cm: 42,
    weight_kg: 1.04,
    depth_m: 3.8,
    date: '2026-05-23',
    time: '11:20',
    lure: 'Ned-rigg (Grön pumpa)',
    note: 'Stenpartiet vid västra grynnan'
  }
];
