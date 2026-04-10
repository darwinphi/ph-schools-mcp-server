const { DEFAULT_LIMIT, MAX_LIMIT } = require('./constants');

function normalize(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase();
}

function toStringValue(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function boundedLimit(limit) {
  const safe = Number(limit ?? DEFAULT_LIMIT);
  if (!Number.isFinite(safe) || safe <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(safe), MAX_LIMIT);
}

function toSchoolSummary(row) {
  return {
    beis_school_id: row['BEIS School ID'] || null,
    school_name: row['School Name'] || null,
    region: row.Region || null,
    division: row.Division || null,
    district: row.District || null,
    municipality: row.Municipality || null,
    barangay: row.Barangay || null,
    sector: row.Sector || null,
    curriculum_classification: row['Modified Curricural Offering Classification'] || null,
  };
}

function createStore(records) {
  if (!Array.isArray(records)) {
    throw new TypeError('records must be an array');
  }

  const byBeisId = new Map();
  const duplicateBeisIds = new Set();
  const regions = new Set();
  const divisionsByRegion = new Map();

  for (const row of records) {
    const beisId = toStringValue(row['BEIS School ID']);
    const region = toStringValue(row.Region);
    const division = toStringValue(row.Division);

    if (beisId) {
      if (byBeisId.has(beisId)) {
        duplicateBeisIds.add(beisId);
      }
      // Keep last record on duplicate IDs so data remains queryable.
      byBeisId.set(beisId, row);
    }

    if (region) {
      regions.add(region);

      if (division) {
        if (!divisionsByRegion.has(region)) {
          divisionsByRegion.set(region, new Set());
        }
        divisionsByRegion.get(region).add(division);
      }
    }
  }

  const sortedRegions = Array.from(regions).sort((a, b) => a.localeCompare(b));

  function searchSchools(filters = {}) {
    const {
      query,
      region,
      division,
      municipality,
      barangay,
      sector,
      limit,
    } = filters;

    const q = normalize(query);
    const regionNorm = normalize(region);
    const divisionNorm = normalize(division);
    const municipalityNorm = normalize(municipality);
    const barangayNorm = normalize(barangay);
    const sectorNorm = normalize(sector);
    const safeLimit = boundedLimit(limit);

    const items = [];

    for (const row of records) {
      const schoolName = normalize(row['School Name']);
      const streetAddress = normalize(row['Street Address']);
      const rowRegion = normalize(row.Region);
      const rowDivision = normalize(row.Division);
      const rowMunicipality = normalize(row.Municipality);
      const rowBarangay = normalize(row.Barangay);
      const rowSector = normalize(row.Sector);

      const textMatch = !q || schoolName.includes(q) || streetAddress.includes(q);
      const regionMatch = !regionNorm || rowRegion === regionNorm;
      const divisionMatch = !divisionNorm || rowDivision === divisionNorm;
      const municipalityMatch = !municipalityNorm || rowMunicipality === municipalityNorm;
      const barangayMatch = !barangayNorm || rowBarangay === barangayNorm;
      const sectorMatch = !sectorNorm || rowSector === sectorNorm;

      if (textMatch && regionMatch && divisionMatch && municipalityMatch && barangayMatch && sectorMatch) {
        items.push(toSchoolSummary(row));
        if (items.length >= safeLimit) {
          break;
        }
      }
    }

    return {
      count: items.length,
      limit: safeLimit,
      items,
    };
  }

  function getSchoolByBeisId(beisSchoolId) {
    const key = toStringValue(beisSchoolId);
    if (!key) return null;
    return byBeisId.get(key) || null;
  }

  function listRegions() {
    return {
      count: sortedRegions.length,
      items: sortedRegions,
    };
  }

  function listDivisions(region) {
    const regionNorm = normalize(region);

    let divisions;
    if (!regionNorm) {
      const allDivisions = new Set();
      for (const set of divisionsByRegion.values()) {
        for (const division of set) {
          allDivisions.add(division);
        }
      }
      divisions = Array.from(allDivisions).sort((a, b) => a.localeCompare(b));
    } else {
      const matchedRegion = sortedRegions.find((entry) => normalize(entry) === regionNorm);
      const set = matchedRegion ? divisionsByRegion.get(matchedRegion) : null;
      divisions = set ? Array.from(set).sort((a, b) => a.localeCompare(b)) : [];
    }

    return {
      region: region || null,
      count: divisions.length,
      items: divisions,
    };
  }

  function datasetStats() {
    const byRegion = {};
    const bySector = {};

    for (const row of records) {
      const region = toStringValue(row.Region) || 'Unknown';
      const sector = toStringValue(row.Sector) || 'Unknown';

      byRegion[region] = (byRegion[region] || 0) + 1;
      bySector[sector] = (bySector[sector] || 0) + 1;
    }

    return {
      total_schools: records.length,
      unique_regions: sortedRegions.length,
      duplicate_beis_school_ids: duplicateBeisIds.size,
      region_breakdown: byRegion,
      sector_breakdown: bySector,
    };
  }

  return {
    records,
    searchSchools,
    getSchoolByBeisId,
    listRegions,
    listDivisions,
    datasetStats,
    duplicateBeisIds: Array.from(duplicateBeisIds).sort(),
  };
}

module.exports = {
  MAX_LIMIT,
  normalize,
  boundedLimit,
  toSchoolSummary,
  createStore,
};
