import axios from 'axios';
import _ from 'lodash';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import fs from 'fs/promises';
import path from 'path';
import { Pax } from '../src/types';

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
    process.cwd(),
    'src/logs',
    startAt.year().toString()
  );
  const logPath = path.join(logsDir, `${startAt.format('YYYY-MM-DD')}.json`);
  await fs.mkdir(logsDir, { recursive: true });

  let records = [];
  try {
    records = JSON.parse(await fs.readFile(logPath, 'utf-8'));
  } catch (err) {
    // check if file exists in typescript
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  } finally {
    const isRangeExists = records.some(
      (r: any) =>
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

async function getPaxData(url: string) {
  type RawPax = {
    paxCnt: string;
    nationality: string;
    age: string;
  };

  const resp = await axios.get(url);
  const paxRows: Pax[] = await resp.data
    .filter(
      (r: RawPax) =>
        r.paxCnt !== null && r.nationality !== null && r.age !== null
    )
    .map((r: RawPax) => ({
      count: Number(r.paxCnt),
      nationality: r.nationality,
      age: r.age,
    }));
  return paxRows;
}

function groupPaxRows(paxData: Pax[]) {
  const groupedData = _.groupBy(paxData, (r) => r.nationality + r.age);
  return Object.values(groupedData).map((rows) => {
    return {
      count: rows.reduce((acc: number, r: Pax) => acc + r.count, 0),
      nationality: rows[0].nationality,
      age: rows[0].age,
    } as Pax;
  });
}
