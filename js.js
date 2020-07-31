const shops = JSON.parse(localStorage.getItem('lastShopsInfoForStockReportHandling')) || [];
const shopsReports = [];

const checkShopName = (name) => {
  const namePart = name.match(/_.+/g);
  shops.forEach((elem, i) => {
    if (elem.includes(namePart)) name = shops[i];
  });
  return name;
}

document.getElementById('shops').onchange = function () {
  let file = this.files[0];
  let reader = new FileReader();
  reader.onload = function (progressEvent) {
    let salons = this.result.split('\n');
    salons.forEach(salon => {
      salon = salon.split(';');
      if (salon[0].includes('_')) shops.push(salon[0]);
    });
    localStorage.setItem(`lastShopsInfoForStockReportHandling`, JSON.stringify(shops));
    outputInfo(updateInfo());
  }
  reader.readAsText(file, 'windows-1251');
}

const whatDayIsItToday = () => {
  const date = new Date();
  let day = date.getDate();
  let month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (day < 10) day = '0' + day;
  if (month < 10) month = '0' + month;
  return `${day}.${month}.${year}`;
}

const updateInfo = () => {
  localStorage.setItem(`fullDateForStockReportHandling`, JSON.stringify(whatDayIsItToday()));
  return whatDayIsItToday();
}

const getLastInfo = () => {
  const last = JSON.parse(localStorage.getItem('fullDateForStockReportHandling'));
  return last;
}

const outputInfo = (correctDate) => {
  document.querySelector('.last-info').textContent = `Последняя загрузка актуальных названий салонов производилась ${correctDate}.`
}

outputInfo(getLastInfo());

const getShopData = (rows, col) => {
  const materials = [`vip`, `vipPack`, `cup`, `cupPack`, `vine`, `chocoSet`, `chest`, `choco5`, `candy`, `leaflet`, `green`, `gray`, `stick`, `clamp`];
  const name = checkShopName(rows[1][col]);
  const consumption = {};
  const leftover = {};
  const forecast = {};
  let consumptionIndex = 2;
  let leftoverIndex = 18;
  let forecastIndex = 34;
  materials.forEach(material => {
    consumption[material] = rows[consumptionIndex][col];
    leftover[material] = rows[leftoverIndex][col];
    forecast[material] = rows[forecastIndex][col];
    consumptionIndex += 1;
    leftoverIndex += 1;
    forecastIndex += 1;
  });
  return { name, consumption, leftover, forecast };
}

document.querySelector('#commonReport').onchange = function () {
  let file = this.files[0];
  let reader = new FileReader();
  reader.onload = function (progressEvent) {
    let rows = this.result.split('\n').map(el => el.split(';'));
    rows[1].forEach((row, i) => shopsReports.push(getShopData(rows, i)));
    // for (let i = 1; i < rows.length - 2; i += 1)
    console.log(shopsReports)
  }
  reader.readAsText(file, 'windows-1251');
}
