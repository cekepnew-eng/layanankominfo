const getTndField = (sources, fieldNames) => {
  const expectedNames = new Set(fieldNames.map(name => name.toLowerCase()));
  for (const source of sources) {
    if (!source || typeof source !== 'object') continue;
    for (const [key, value] of Object.entries(source)) {
      if (expectedNames.has(key.toLowerCase()) && value !== null && value !== undefined && value !== '') {
        return value;
      }
    }
  }
  return '';
};

module.exports = { getTndField };
