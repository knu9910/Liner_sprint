module.exports = (themeId) => {
  const themes = [
    ['#ffff8d', '#a5f2e9', '#ffd5c8'],
    ['#f6f0aa', '#d3edd1', '#f9d6c1'],
    ['#f4ff40', '#8affd7', '#ffc477'],
  ];

  return themes[themeId - 1];
};
