export type ParsedPhone = {
  countryCode: string;
  nationalNumber: string;
  raw: string;
  formatted: string;
};

export type Country = {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
};
