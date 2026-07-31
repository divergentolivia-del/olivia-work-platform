(function () {
  const templateData = window.OLIVIA_TEMPLATE_DATA || { modules: [], statuses: [], audiences: [], colors: {} };
  const userData = window.OLIVIA_USER_DATA || { itemsByModule: {} };

  window.WORKBENCH_DATA = {
    ...templateData,
    userItemsByModule: userData.itemsByModule || {}
  };
})();
