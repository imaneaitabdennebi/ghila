/**
 * GitHub Pages : sans .nojekyll, Jekyll ignore le dossier _expo → page blanche.
 * `experiments.baseUrl` doit être `/nom-exact-du-depot` pour les URLs du type
 * https://user.github.io/nom-exact-du-depot/ (sinon les JS/CSS pointent vers la racine du domaine).
 *
 * En CI (GitHub Actions), GITHUB_REPOSITORY est défini automatiquement.
 * En local : EXPO_PUBLIC_BASE_URL=/MonRepo npx expo export -p web
 */
const base = require('./app.json');

function getBaseUrl() {
  const manual = process.env.EXPO_PUBLIC_BASE_URL;
  if (manual !== undefined && manual !== '') {
    return manual.startsWith('/') ? manual : `/${manual}`;
  }
  const gh = process.env.GITHUB_REPOSITORY;
  if (gh && gh.includes('/')) {
    return `/${gh.split('/')[1]}`;
  }
  return undefined;
}

const baseUrl = getBaseUrl();

module.exports = {
  expo: {
    ...base.expo,
    experiments: {
      ...(base.expo.experiments || {}),
      ...(baseUrl !== undefined ? { baseUrl } : {}),
    },
  },
};
