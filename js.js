const shops = JSON.parse(localStorage.getItem('lastShopsInfoForStockReportHandling')) || [];
const handleReports = [];
const topShops = ["А21_ТЦ Ленинская Слобода (Roomer)", "А21_ТЦ Ленинская Слобода 3 (Roomer)", "А21_Кронштадтский б-р", "А21_ТЦ Империя"]
let shopsReports;
const tableRows = [];


//getting shop name for check
const checkShopName = (name) => {
  const namePart = name.match(/_.+/g);
  shops.forEach((elem, i) => {
    if (elem.includes(namePart)) name = shops[i];
  });
  return name;
}

//upload actual shop list
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

//generation of date tip for actual shop list
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

const comma2Dot = (num) => {
  const str = num + '';
  let result;
  if (str.includes(',')) {
    result = str.replace(/,/, '.');
    // console.log(`result:${result}`)
    return +result;
  }
  // console.log(`num:${num}`)
  return num;
}

//handle stock reports data making an object for each shop
const getShopData = (rows, col) => {
  const materials = [`vip`, `vipPack`, `cup`, `cupPack`, `vine`, `chocoSet`, `chest`, `choco5`, `candy`, `leaflet`, `green`, `gray`, `stick`, `clamp`];
  const name = checkShopName(rows[1][col]);
  const consumption = {};
  const leftover = {};
  const forecast = {};
  forecast.poster = rows[34][col];
  let consumptionIndex = 2;
  let leftoverIndex = 18;
  let forecastIndex = 35;
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

//getting an array of objects with stock reports data
document.querySelector('#commonReport').onchange = function () {
  let file = this.files[0];
  let reader = new FileReader();
  reader.onload = function (progressEvent) {
    let rows = this.result.split('\n').map(el => el.split(';'));
    rows[1].forEach((row, i) => {
      handleReports.push(getShopData(rows, i));
    });
    shopsReports = handleReports.filter(el => el.name.includes('_'))
    shopsReports.forEach((report, i) => calcShipment(report, i));
    // console.log(shopsReports)
  }
  reader.readAsText(file, 'windows-1251');
}

const choco5Helper = (obj) => {
  let foreChoco5 = comma2Dot(obj.forecast.choco5);
  let consChoco5 = comma2Dot(obj.consumption.choco5);
  if (+foreChoco5 < 10) foreChoco5 *= 250;
  if (+consChoco5 < 10) foreChoco5 *= 250;
  if (foreChoco5 % 250) {
    foreChoco5 = Math.floor(foreChoco5 / 250 < 1 ? 1 : foreChoco5 / 250) * 250;
    // console.log(`${obj.name} - foreChoco5:${foreChoco5}`)
  };
  if (consChoco5 % 250) {
    consChoco5 = Math.floor(consChoco5 / 250 < 1 ? 1 : consChoco5 / 250) * 250;
    // console.log(`${obj.name} - consChoco5:${consChoco5}`);
  }
  return Math.min(consChoco5, (foreChoco5));
}

const candyHelper = (obj) => {
  let divider;
  if (obj.forecast.candy > 1) {
    switch (obj.forecast.candy.toString().length) {
      case 2:
        divider = 10;
        break;
      case 3:
        divider = 1000;
        break;
      case 4:
        divider = 1000;
        break;
      default:
        divider = 1;
    }
  } else {
    return obj.forecast.candy.toString().replace('.', ',');
  }
  let candy = obj.forecast.candy / divider;
  return candy - obj.consumption.candy > 3 ?  (candy + 1).toString().replace('.', ',') : candy.toString().replace('.', ',');
}

//calc of material shipment
const calcShipment = (obj, i) => {
  if (topShops.some(el => el === obj.name)) {
    const poster = obj.forecast.poster;
    const vip = obj.leftover.vip < 20 ? 20 - obj.leftover.vip : 0;
    const vipPack = obj.leftover.vipPack < 20 ? 20 - obj.leftover.vipPack : 0;
    const cup = obj.forecast.cup;
    const cupPack = obj.forecast.cupPack;
    const vine = obj.forecast.vine % 6 ?
      Math.ceil(obj.forecast.vine / 6) * 6 : obj.forecast.vine;
    const chocoSet = obj.forecast.chocoSet;
    const chest = obj.forecast.chest;
    const choco5 = obj.forecast.choco5 < 10 ?
      obj.forecast.choco5 *= 250 : obj.forecast.choco5 % 250 ?
        Math.ceil(obj.forecast.choco5 / 250) * 250 : obj.forecast.choco5;
    const candy = candyHelper(obj);
    const leaflet = obj.forecast.leaflet;
    const green = obj.forecast.green;
    const gray = obj.forecast.gray;
    const clamp = obj.forecast.clamp;
    const stick = obj.forecast.stick;
    console.log(`${obj.name}, i:${i}, vip:${vip}, vipPack:${vipPack}, cup:${cup}, cupPack:${cupPack}, vine:${vine}, chocoSet:${chocoSet}, choco5:${choco5}, candy:${candy}, green:${green}, gray:${gray}`);
    return tableRows.push(`${+i + 1};${obj.name};${poster};${vip};${vipPack};${cup};${cupPack};${vine};${chocoSet};${chest};${choco5};${candy};${leaflet};${green};${gray};${clamp};${stick}`);
  } else {
    const poster = obj.forecast.poster;
    const vip = obj.leftover.vip < 10 ? 10 - obj.leftover.vip : 0;
    const vipPack = obj.leftover.vipPack < 10 ? 10 - obj.leftover.vipPack : 0;
    const cup = obj.forecast.cup - obj.consumption.cup < 0 ?
      obj.forecast.cup : obj.leftover.cup - obj.forecast.cup < 20 ?
        obj.forecast.cup : 0;
    const cupPack = obj.forecast.cupPack - obj.consumption.cucupPackp < 0 ?
      obj.forecast.cupPack : obj.leftover.cupPack - obj.forecast.cupPack < 20 ?
        obj.forecast.cupPack : 0;
    const vine = obj.consumption.vine - obj.forecast.vine < 0 ?
      Math.ceil(obj.consumption.vine / 6) * 6 === 0 ?
        6 : Math.ceil(obj.consumption.vine / 6) * 6 : Math.floor(obj.forecast.vine / 6) * 6;
    const chocoSet = obj.forecast.chocoSet - obj.consumption.chocoSet > 0 ?
      obj.consumption.chocoSet : obj.forecast.chocoSet;
    const chest = obj.forecast.chest;
    const choco5 = choco5Helper(obj);
    const candy = candyHelper(obj);
    const leaflet = obj.forecast.leaflet;
    const green = obj.leftover.green >= 40 ? 0 : obj.forecast.green;
    const gray = obj.leftover.gray >= 40 ? 0 : obj.forecast.gray;
    const clamp = obj.leftover.clamp >= 80 ? 0 : obj.forecast.clamp;
    const stick = obj.leftover.stick >= 80 ? 0 : obj.forecast.stick;
    console.log(`${obj.name}, i:${i}, vip:${vip}, vipPack:${vipPack}, cup:${cup}, cupPack:${cupPack}, vine:${vine}, chocoSet:${chocoSet}, choco5:${choco5}, candy:${candy}, green:${green}, gray:${gray}`);
    return tableRows.push(`${+i + 1};${obj.name};${poster};${vip};${vipPack};${cup};${cupPack};${vine};${chocoSet};${chest};${choco5};${candy};${leaflet};${green};${gray};${clamp};${stick}`);
  }

}
//final row for result table - don't need it

//"\uFEFF" + 
document.getElementById('download').onclick = function () {
  let csv = `№;Салон;Плакат;VIP;Пакет;Кружка;Упаковка;Шампанское;Шок. Наб.;Развертка;Шоколад 5гр;Леденец;Листовка;Зеленый;Серый;Зажим;Палочка\n`;
  tableRows.forEach((elem, i) => {
    // csv += i + 1;
    csv += elem;
    csv += `\n`;
  });
  var hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI("\uFEFF" + csv);
  hiddenElement.target = '_blank';
  hiddenElement.download = 'Отгрузочная таблица.csv';
  hiddenElement.click();
}