export interface BrandState {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  logo: string | null;
}

export const defaultBrand: BrandState = {
  name: "Flawless Electric Inc",
  tagline: "Military discipline. Trade precision.",
  email: "Gonzalo@flawlesselectricinc.com",
  phone: "5037408597",
  logo: null,
};
