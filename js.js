const materials = [`vip`, `vipPack`, `cup`, `cupPack`, `vine`, `chocoSet`, `chest`, `choco5`, `candy`, `leaflet`, `green`, `gray`, `stick`, `clamp`];
const shops = JSON.parse(localStorage.getItem('lastShopsInfoForStockReportHandling')) || [];
const handleReports = [];
// let tempReports;
let shopsReports = [];
// const tableRows = [];
const sumMoscow = {};
const sumRegion = {};
const shopsMoscow = [];
const shopsRegion = [];
let reportsMoscow = [];
let reportsRegion = [];
const shopsMoscowForCalc = [];
const shopsRegionForCalc = [];
//TOTAL SUMMS
const tT = {};


//getting shop name for check
const checkShopName = (name) => {
  const namePart = name.match(/_.+/g);
  shops.forEach((elem, i) => {
    if (elem.includes(namePart)) name = shops[i];
  });
  return name.split('"').join('');
}

// const sortShops = (shopsReports, shops) => { 
//   const itemsByIndex = new Map(shops.map((shop, index) => [shop, index]));
//   console.log(itemsByIndex);
//   return shopsReports.forEach((report, i) => {
//     if (report.name === itemsByIndex.key) i = itemsByIndex.value;
//   })
// }

//upload actual shop list
document.getElementById('shops').onchange = function () {
  shops.length = 0;
  let file = this.files[0];
  let reader = new FileReader();
  reader.onload = function (progressEvent) {
    let salons = this.result.split('\n');
    salons.forEach(salon => {
      salon = salon.split(';');
      let shop = salon[0];
      if (shop.includes('_')) {
        const res = shop.split('"').join('');
        shops.push(res);
      };
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
    return +result;
  }
  return num;
}

//handle stock reports data making an object for each shop
const getShopData = (rows, col) => {
  const name = checkShopName(rows[1][col]);
  const region = rows[49][col];
  const status = rows[50][col];
  const consumption = {};
  const leftover = {};
  const forecast = {};
  forecast.poster = rows[34][col];
  let consumptionIndex = 2;
  let leftoverIndex = 18;
  let forecastIndex = 35;
  materials.forEach(material => {
    sumMoscow[material] = 0;
    sumRegion[material] = 0;
    consumption[material] = rows[consumptionIndex][col];
    leftover[material] = rows[leftoverIndex][col];
    forecast[material] = rows[forecastIndex][col];
    consumptionIndex += 1;
    leftoverIndex += 1;
    forecastIndex += 1;
  });
  return { name, region, status, consumption, leftover, forecast };
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
    shopsReports = handleReports.filter(el => el.name.includes('_'));
    reportsMoscow = shopsReports.filter(el => el.region === 'Moscow');
    reportsRegion = shopsReports.filter(el => el.region !== 'Moscow');
    // console.log(shopsReports);
    // console.log(reportsMoscow);
    // console.log(reportsRegion);
    reportsMoscow.forEach((report, i) => calcShipment(report, i));
    reportsRegion.forEach((report, i) => calcShipment(report, i));
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
  };
  if (consChoco5 % 250) {
    consChoco5 = Math.floor(consChoco5 / 250 < 1 ? 1 : consChoco5 / 250) * 250;
  }
  return Math.min(consChoco5, foreChoco5);
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
  return candy - obj.consumption.candy > 3 ? (candy + 1).toString().replace('.', ',') : candy.toString().replace('.', ',');
}

const getLeaflets = (leaflet) => {
  leaflet = +leaflet.toString().replace(',', '.');
  return leaflet === 0 ?
    0 : leaflet < 100 ?
      100 : leaflet;
}

//calc of material shipment
const calcShipment = (obj, i) => {
  if (obj.status === 'top') {
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
    const leaflet = getLeaflets(obj.forecast.leaflet);
    const green = obj.forecast.green;
    const gray = obj.forecast.gray;
    const clamp = obj.forecast.clamp;
    const stick = obj.forecast.stick;
    //getting an object with final data and add it to an appropriate array
    const dataForCalc = {};
    dataForCalc.poster = obj.forecast.poster;
    dataForCalc.name = obj.name;
    dataForCalc.vip = vip;
    dataForCalc.vipPack = vipPack;
    dataForCalc.cup = cup;
    dataForCalc.cupPack = cupPack;
    dataForCalc.vine = vine;
    dataForCalc.chocoSet = chocoSet;
    dataForCalc.chest = chest;
    dataForCalc.choco5 = choco5;
    dataForCalc.candy = candy;
    dataForCalc.leaflet = leaflet;
    dataForCalc.green = green;
    dataForCalc.gray = gray;
    dataForCalc.clamp = clamp;
    dataForCalc.stick = stick;
    obj.region === 'Moscow' ? shopsMoscowForCalc.push(dataForCalc) : shopsRegionForCalc.push(dataForCalc);
    //
    const result = `${obj.name};${poster};${vip};${vipPack};${cup};${cupPack};${vine};${chocoSet};${chest};${choco5};${candy};${leaflet};${green};${gray};${clamp};${stick}`;
    return obj.region === 'Moscow' ? shopsMoscow.push(result) : shopsRegion.push(result);
    // return tableRows.push(`${+i + 1};${obj.name};${poster};${vip};${vipPack};${cup};${cupPack};${vine};${chocoSet};${chest};${choco5};${candy};${leaflet};${green};${gray};${clamp};${stick}`);
  } else {
    const poster = obj.forecast.poster;
    const vip = obj.leftover.vip > 9 ? 0 : 10 - obj.leftover.vip;
    const vipPack = obj.leftover.vipPack > 9 ? 0 : 10 - obj.leftover.vipPack;
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
    const leaflet = getLeaflets(obj.forecast.leaflet);
    const green = obj.leftover.green >= 40 ? 0 : obj.forecast.green;
    const gray = obj.leftover.gray >= 40 ? 0 : obj.forecast.gray;
    const clamp = obj.leftover.clamp >= 80 ? 0 : obj.forecast.clamp;
    const stick = obj.leftover.stick >= 80 ? 0 : obj.forecast.stick;
    //getting an object with final data and add it to an appropriate array
    const dataForCalc = {};
    dataForCalc.poster = obj.forecast.poster;
    dataForCalc.name = obj.name;
    dataForCalc.vip = vip;
    dataForCalc.vipPack = vipPack;
    dataForCalc.cup = cup;
    dataForCalc.cupPack = cupPack;
    dataForCalc.vine = vine;
    dataForCalc.chocoSet = chocoSet;
    dataForCalc.chest = chest;
    dataForCalc.choco5 = choco5;
    dataForCalc.candy = candy;
    dataForCalc.leaflet = leaflet;
    dataForCalc.green = green;
    dataForCalc.gray = gray;
    dataForCalc.clamp = clamp;
    dataForCalc.stick = stick;
    obj.region === 'Moscow' ? shopsMoscowForCalc.push(dataForCalc) : shopsRegionForCalc.push(dataForCalc);
    //
    const result = `${obj.name};${poster};${vip};${vipPack};${cup};${cupPack};${vine};${chocoSet};${chest};${choco5};${candy};${leaflet};${green};${gray};${clamp};${stick}`;
    return obj.region === 'Moscow' ? shopsMoscow.push(result) : shopsRegion.push(result);
    // console.log(`${obj.name}, i:${i}, vip:${vip}, vipPack:${vipPack}, cup:${cup}, cupPack:${cupPack}, vine:${vine}, chocoSet:${chocoSet}, choco5:${choco5}, candy:${candy}, green:${green}, gray:${gray}`);
    // return tableRows.push(`${+i + 1};${obj.name};${poster};${vip};${vipPack};${cup};${cupPack};${vine};${chocoSet};${chest};${choco5};${candy};${leaflet};${green};${gray};${clamp};${stick}`);
  }
}

const total = (arr) => {
  const summs = {};
  materials.push('poster');
  materials.forEach(mat => summs[mat] = 0);
  arr.forEach(shop => {
    // console.log(`${shop.name} candy: ${shop.candy}, type: ${typeof shop.candy}`);
    for (material in summs) {
      summs[material] += +shop[material].toString().replace(',', '.');
    }
  })
  // console.log(summs);
  for (elem in summs) {
    tT[elem] === undefined ? tT[elem] = summs[elem] : tT[elem] += summs[elem];
  }
  return `;ИТОГО;${summs.poster};${summs.vip};${summs.vipPack};${summs.cup};${summs.cupPack};${summs.vine};${summs.chocoSet};${summs.chest};${summs.choco5};${summs.candy.toString().replace('.', ',')};${summs.leaflet.toString().replace('.', ',')};${summs.green};${summs.gray};${summs.clamp};${summs.stick}`;
}

//"\uFEFF" + 
document.getElementById('download').onclick = function () {
  let csv = `№;Салон;Плакат;VIP;Пакет;Кружка;Упаковка;Шампанское;Шок. Наб.;Развертка;Шоколад 5гр;Леденец;Листовка;Зеленый;Серый;Зажим;Палочка\n`;
  shopsMoscow.sort();
  shopsRegion.sort();
  // sortShops(shopsReports, shops);
  shopsMoscow.forEach((shop, i) => {
    csv += `${+i + 1};`;
    csv += shop;
    csv += `\n`;
  });
  //SUMMARY MOSCOW
  csv += total(shopsMoscowForCalc);
  csv += `\n`;
  //
  shopsRegion.forEach((shop, i) => {
    csv += `${+i + 1};`;
    csv += shop;
    csv += `\n`;
  });
  //SUMMARY REGION
  csv += total(shopsRegionForCalc);
  csv += `\n`;
  //TOTAL OUTPUT
  csv += `;ИТОГО ВСЕГО;${tT.poster};${tT.vip};${tT.vipPack};${tT.cup};${tT.cupPack};${tT.vine};${tT.chocoSet};${tT.chest};${tT.choco5};${tT.candy.toString().replace('.', ',')};${tT.leaflet.toString().replace('.', ',')};${tT.green};${tT.gray};${tT.clamp};${tT.stick}`;
  csv += `\n`;
  var hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI("\uFEFF" + csv);
  hiddenElement.target = '_blank';
  hiddenElement.download = 'Отгрузочная таблица.csv';
  hiddenElement.click();
}