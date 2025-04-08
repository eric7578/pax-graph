#!/usr/bin/env node

const axios = require('axios');
const _ = require('lodash');
const dayjs = require('dayjs');
const timezone = require('dayjs/plugin/timezone');
const fs = require('fs/promises');
const path = require('path');

dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Taipei');

(async () => {
  const leave = [
    'https://opendata.immigration.gov.tw/APIS/CYI5',
    'https://opendata.immigration.gov.tw/APIS/HUN5',
    'https://opendata.immigration.gov.tw/APIS/KHH5',
    'https://opendata.immigration.gov.tw/APIS/MZG5',
    'https://opendata.immigration.gov.tw/APIS/PIF5',
    'https://opendata.immigration.gov.tw/APIS/RMQ5',
    'https://opendata.immigration.gov.tw/APIS/TNN5',
    'https://opendata.immigration.gov.tw/APIS/TPE5',
    'https://opendata.immigration.gov.tw/APIS/TSA5',
    'https://opendata.immigration.gov.tw/APIS/TTT5',
  ];

  const enter = [
    'https://opendata.immigration.gov.tw/APIS/CYI1',
    'https://opendata.immigration.gov.tw/APIS/HUN1',
    'https://opendata.immigration.gov.tw/APIS/KHH1',
    'https://opendata.immigration.gov.tw/APIS/MZG1',
    'https://opendata.immigration.gov.tw/APIS/PIF1',
    'https://opendata.immigration.gov.tw/APIS/RMQ1',
    'https://opendata.immigration.gov.tw/APIS/TNN1',
    'https://opendata.immigration.gov.tw/APIS/TPE1',
    'https://opendata.immigration.gov.tw/APIS/TSA1',
    'https://opendata.immigration.gov.tw/APIS/TTT1',
  ];

  const leaveRecords = groupPaxRows(
    _.flatten(await Promise.all(leave.map((u) => getPaxData(u))))
  );
  const enterRecords = groupPaxRows(
    _.flatten(await Promise.all(enter.map((u) => getPaxData(u))))
  );
  const startAt = dayjs().startOf('hour');
  const range = [startAt.subtract(3, 'hours'), startAt];
  const logsDir = path.join(
    __dirname,
    '../src/logs',
    startAt.year().toString()
  );
  const logPath = path.join(logsDir, `${startAt.format('YYYY-MM-DD')}.json`);
  await fs.mkdir(logsDir, { recursive: true });

  let records = [];
  try {
    records = JSON.parse(await fs.readFile(logPath, 'utf-8'));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  } finally {
    const isRangeExists = records.some(
      (r) =>
        r.range[0] === range[0].toISOString() &&
        r.range[1] === range[1].toISOString()
    );
    if (isRangeExists) {
      console.log('Range already exists');
      return;
    }
  }

  await fs.writeFile(
    logPath,
    JSON.stringify([
      ...records,
      {
        range: range.map((r) => r.toISOString()),
        leave: leaveRecords,
        enter: enterRecords,
      },
    ])
  );
})();

async function getPaxData(url) {
  const resp = await axios.get(url);
  const paxRows = resp.data
    .filter(
      (r) => r.paxCnt !== null && r.nationality !== null && r.age !== null
    )
    .map((r) => ({
      count: Number(r.paxCnt),
      nationality: r.nationality,
      age: r.age,
    }));
  return paxRows;
}

function groupPaxRows(paxData) {
  const groupedData = _.groupBy(paxData, (r) => r.nationality + r.age);
  return Object.values(groupedData).map((rows) => {
    return {
      count: rows.reduce((acc, r) => acc + r.count, 0),
      nationality: rows[0].nationality,
      age: rows[0].age,
    };
  });
}
