export const DEFAULT_PERIOD_DAYS = 7;
export const TIMEZONE = "America/Fortaleza";

export type ReviewerConfig = {
  name: string;
  logins: string[];
};

export const REVIEWERS: ReviewerConfig[] = [
  { name: "Guilherme Faleiros", logins: ["guilhermefaleiros", "guilhermefaleiros1"] },
  { name: "Augusto Xavier", logins: ["XavierNeto"] },
  { name: "Bruno Pontes", logins: ["brunopdt"] },
  { name: "Williams Santiago", logins: ["wssantiago"] },
  { name: "Yhago Carvalho", logins: ["yhagocarvalho"] },
];