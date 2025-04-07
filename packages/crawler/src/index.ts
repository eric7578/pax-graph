import axios from 'axios';
import _ from 'lodash';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Taipei');

const startAt = dayjs().startOf('hour');
const range = [startAt.subtract(3, 'hours'), startAt];

type Pax = {
  count: number;
  nationality: string;
  age: string;
};

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

async function main() {
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

  const leaveRecords = _.flatten(
    await Promise.all(leave.map((u) => getPaxData(u)))
  );
  const enterRecords = _.flatten(
    await Promise.all(enter.map((u) => getPaxData(u)))
  );
  console.log({
    range: range.map((r) => r.toDate().toISOString()),
    leavePaxCount: leaveRecords.reduce(
      (acc: number, r: Pax) => acc + r.count,
      0
    ),
    enterPaxCount: enterRecords.reduce(
      (acc: number, r: Pax) => acc + r.count,
      0
    ),
  });
}

main();
