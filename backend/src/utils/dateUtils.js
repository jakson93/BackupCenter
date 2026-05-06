function nowIso() {
  return new Date().toISOString();
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function isOlderThan(dateLike, hours) {
  if (!dateLike) return true;
  const t = new Date(dateLike).getTime();
  if (!Number.isFinite(t)) return true;
  return t < hoursAgo(hours).getTime();
}

module.exports = { nowIso, isOlderThan };
