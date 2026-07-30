import { describe, expect, it } from "vitest";

import {
  CHART_BASELINE,
  CHART_LEFT,
  CHART_RIGHT,
  CHART_TOP,
  accessLevelLabel,
  chartCeiling,
  chartGeometry,
  chartLabels,
  initials,
  invitationStatusLabel,
  readingTime,
} from "./activity";

describe("chartCeiling", () => {
  it("monte au multiple de quatre supérieur, pour des graduations entières", () => {
    expect(chartCeiling([11])).toBe(12);
    expect(chartCeiling([1, 5, 9])).toBe(12);
    expect(chartCeiling([8])).toBe(8);
  });

  it("garde un axe gradué quand il ne s'est rien passé", () => {
    // Sans plancher, l'axe irait de 0 à 0 : le graphique paraîtrait cassé
    // plutôt que vide, et la division par le maximum donnerait NaN.
    expect(chartCeiling([])).toBe(4);
    expect(chartCeiling([0, 0, 0])).toBe(4);
  });
});

describe("chartGeometry", () => {
  const series = [
    { day: "1 juil", value: 0 },
    { day: "2 juil", value: 6 },
    { day: "3 juil", value: 12 },
  ];

  it("pose le premier point à gauche et le dernier à droite", () => {
    const { points } = chartGeometry(series);
    expect(points[0].x).toBe(CHART_LEFT);
    expect(points[2].x).toBe(CHART_RIGHT);
  });

  it("pose une valeur nulle sur l'axe et le maximum au sommet", () => {
    const { points } = chartGeometry(series);
    expect(points[0].y).toBe(CHART_BASELINE);
    expect(points[2].y).toBe(CHART_TOP);
  });

  it("rend une chaîne directement utilisable par une polyline", () => {
    const { polyline } = chartGeometry(series);
    expect(polyline).toBe(`${CHART_LEFT},204 539,112 ${CHART_RIGHT},20`);
  });

  it("ne divise jamais par zéro sur une série vide de consultations", () => {
    const plate = chartGeometry([
      { day: "1 juil", value: 0 },
      { day: "2 juil", value: 0 },
    ]);
    expect(plate.points.every((point) => point.y === CHART_BASELINE)).toBe(true);
    expect(plate.max).toBe(4);
  });

  it("garde un seul point centré à gauche plutôt que NaN", () => {
    const seul = chartGeometry([{ day: "1 juil", value: 3 }]);
    expect(seul.points[0].x).toBe(CHART_LEFT);
    expect(Number.isNaN(seul.points[0].y)).toBe(false);
  });

  it("gradue de haut en bas, du maximum à zéro", () => {
    const { ticks } = chartGeometry(series);
    expect(ticks.map((tick) => tick.label)).toEqual(["12", "9", "6", "3", "0"]);
  });
});

describe("chartLabels", () => {
  const points = chartGeometry(
    Array.from({ length: 30 }, (_, index) => ({
      day: `${index + 1} juil`,
      value: index,
    })),
  ).points;

  it("réduit trente jours à sept étiquettes, premières et dernières comprises", () => {
    const labels = chartLabels(points);
    expect(labels).toHaveLength(7);
    expect(labels[0].label).toBe("1 juil");
    expect(labels[6].label).toBe("30 juil");
  });

  it("n'invente pas d'étiquette quand les jours sont moins nombreux", () => {
    const court = chartGeometry([
      { day: "1 juil", value: 1 },
      { day: "2 juil", value: 2 },
    ]).points;
    expect(chartLabels(court)).toHaveLength(2);
  });
});

describe("readingTime", () => {
  it("dit les minutes, puis les heures", () => {
    expect(readingTime(24 * 60000)).toBe("24 min");
    expect(readingTime(60 * 60000)).toBe("1 h");
    expect(readingTime(65 * 60000)).toBe("1 h 05");
  });

  it("ne dit jamais « 0 min » d'une lecture qui a eu lieu", () => {
    expect(readingTime(3000)).toBe("moins d’une minute");
  });
});

describe("accessLevelLabel", () => {
  it("dit ce que la personne peut faire, pas le nom technique du niveau", () => {
    expect(accessLevelLabel("watermark")).toBe("Lecture filigranée");
    expect(accessLevelLabel("download")).toBe("Téléchargement");
  });

  it("laisse passer un niveau inconnu plutôt que de l'effacer", () => {
    expect(accessLevelLabel("niveau-futur")).toBe("niveau-futur");
  });
});

describe("invitationStatusLabel", () => {
  const now = new Date("2026-07-30T12:00:00Z");

  it("nomme les statuts courants", () => {
    expect(invitationStatusLabel("sent", null, now).label).toBe("Invitation envoyée");
    expect(invitationStatusLabel("accepted", null, now).label).toBe("Actif");
  });

  it("déclasse un accès accepté dont l'échéance est passée", () => {
    // La base garde `accepted` après l'échéance : l'afficher tel quel ferait
    // croire à un accès encore ouvert.
    const verdict = invitationStatusLabel("accepted", "2026-07-01T00:00:00Z", now);
    expect(verdict.label).toBe("Expiré");
  });

  it("laisse actif un accès dont l'échéance est à venir", () => {
    expect(
      invitationStatusLabel("accepted", "2026-12-31T00:00:00Z", now).label,
    ).toBe("Actif");
  });
});

describe("initials", () => {
  it("prend la première et la dernière initiale", () => {
    expect(initials("Amina Diallo")).toBe("AD");
    expect(initials("Marie Claire Dupont")).toBe("MD");
  });

  it("se contente d'un seul mot", () => {
    expect(initials("Amara")).toBe("AM");
  });

  it("ne plante pas sur un nom vide", () => {
    expect(initials("   ")).toBe("—");
  });
});
