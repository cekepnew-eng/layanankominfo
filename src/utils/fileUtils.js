export const parseFileValue = (val) => {
  if (!val) return { name: '', data: '' };
  if (val.includes('|||')) {
    const [name, data] = val.split('|||');
    return { name, data };
  }
  if (val.includes('||')) {
    const [name, data] = val.split('||');
    return { name, data };
  }
  if (val.startsWith('data:')) return { name: 'Dokumen.pdf', data: val };
  return { name: val, data: val };
};
