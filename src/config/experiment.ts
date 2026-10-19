import draft from './experiment.json';

type Experiment = {
  id: string;
  offerVersion: string;
  approved: boolean;
  monthlyPriceCents: number | null;
  currency: string;
  subtitleLanguages: string[];
  devices: string[];
  films: { title: string; poster: string; rightsApproved: boolean }[];
};
export const experiment: Experiment = draft;
export const offerReady = experiment.approved &&
  Number.isInteger(experiment.monthlyPriceCents) && (experiment.monthlyPriceCents || 0) > 0 &&
  experiment.currency === 'EUR' && experiment.films.length >= 6 &&
  experiment.subtitleLanguages.length > 0 && experiment.devices.length > 0 &&
  experiment.films.every(film => film.rightsApproved && film.title && film.poster.startsWith('/'));
export const monthlyPrice = new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' })
  .format((experiment.monthlyPriceCents || 0) / 100);
