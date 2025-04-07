import axios from 'axios';
import _ from 'lodash';

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
  const url = [
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

  const paxRows = _.flatten(await Promise.all(url.map((u) => getPaxData(u))));
  const groupByNatAge = _.groupBy(paxRows, (r) => r.nationality + r.age);
  const rows: Pax[] = Object.values(groupByNatAge).map((r: Pax[]) => ({
    nationality: r[0].nationality,
    age: r[0].age,
    count: _.sumBy(r, 'count'),
  }));
  console.log(rows);
}

main();
