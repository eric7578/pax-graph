import { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Log, Pax } from './types';
import _ from 'lodash';
import '@radix-ui/themes/styles.css';
import { Button, DropdownMenu, Flex, Theme } from '@radix-ui/themes';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Taipei');

const allLogs = JSON.parse(import.meta.env.VITE_PAX_LOGS) as Log[];

const allNationalities = [
  ...new Set(
    _.flatten([
      ...allLogs.map((log: Log) => [
        ...log.leave.map((l) => l.nationality),
        ...log.enter.map((e) => e.nationality),
      ]),
    ])
  ),
];

const allAges = [
  ...new Set(
    _.flatten([
      ...allLogs.map((log: Log) => [
        ...log.leave.map((l) => l.age),
        ...log.enter.map((e) => e.age),
      ]),
    ])
  ),
].sort((a, b) => {
  const aRange = getAgeRange(a);
  const bRange = getAgeRange(b);
  if (aRange[0] === bRange[0]) {
    return aRange[1] - bRange[1];
  }
  return aRange[0] - bRange[0];
});

function getAgeRange(age: string) {
  if (age.includes('Above')) {
    return [Number(age.replace('Above', '').trim()), 100];
  }
  if (age.includes('Under')) {
    return [0, Number(age.replace('Under', '').trim())];
  }
  return age.split('~').map((a) => Number(a.trim()));
}

export default function App() {
  const [checkedNationalities, setCheckedNationalities] = useState(
    () => new Set(allNationalities.filter((n) => n !== 'TWN' && n !== 'CHN'))
  );
  const [checkedAges, setCheckedAges] = useState(() => new Set(allAges));

  const filteredNationalitiesLogs = useMemo(() => {
    const filterPax = (p: Pax) =>
      checkedNationalities.has(p.nationality) && checkedAges.has(p.age);
    return allLogs.map((log) => {
      return {
        ...log,
        leave: log.leave.filter(filterPax),
        enter: log.enter.filter(filterPax),
      };
    });
  }, [checkedNationalities, checkedAges]);

  const chartLogs = useMemo(() => {
    return filteredNationalitiesLogs.map((l: Log) => {
      return {
        date: dayjs(l.range[0]),
        leave: l.leave.reduce((acc, p) => acc + p.count, 0),
        enter: l.enter.reduce((acc, p) => acc + p.count, 0),
      };
    });
  }, [filteredNationalitiesLogs]);

  console.log(filteredNationalitiesLogs);

  return (
    <Theme>
      <Flex direction="row" align="center" justify="end" gap="1" mx="2">
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button variant="soft">
              Nationalities
              <DropdownMenu.TriggerIcon />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            {Object.entries(
              _.groupBy(allNationalities, (n) => n.charAt(0))
            ).map(([fstChar, nats]) => (
              <DropdownMenu.Sub>
                <DropdownMenu.SubTrigger>{fstChar}</DropdownMenu.SubTrigger>
                <DropdownMenu.SubContent>
                  {nats.map((nat) => (
                    <DropdownMenu.CheckboxItem
                      key={nat}
                      checked={checkedNationalities.has(nat)}
                      onClick={(e) => {
                        e.preventDefault();
                        if (checkedNationalities.has(nat)) {
                          setCheckedNationalities((prev) => {
                            const newSet = new Set(prev);
                            newSet.delete(nat);
                            return newSet;
                          });
                        } else {
                          setCheckedNationalities(
                            (prev) => new Set([...prev, nat])
                          );
                        }
                      }}
                    >
                      {nat}
                    </DropdownMenu.CheckboxItem>
                  ))}
                </DropdownMenu.SubContent>
              </DropdownMenu.Sub>
            ))}
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              color="red"
              onClick={(e) => {
                e.preventDefault();
                setCheckedNationalities(new Set(allNationalities));
              }}
            >
              Check All
            </DropdownMenu.Item>
            <DropdownMenu.Item
              color="red"
              onClick={(e) => {
                e.preventDefault();
                setCheckedNationalities(new Set());
              }}
            >
              Uncheck All
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            <Button variant="soft">
              Ages
              <DropdownMenu.TriggerIcon />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            {allAges.map((a) => (
              <DropdownMenu.CheckboxItem
                key={a}
                checked={checkedAges.has(a)}
                onClick={(e) => {
                  e.preventDefault();
                  if (checkedAges.has(a)) {
                    setCheckedAges((prev) => {
                      const newSet = new Set(prev);
                      newSet.delete(a);
                      return newSet;
                    });
                  } else {
                    setCheckedAges((prev) => new Set([...prev, a]));
                  }
                }}
              >
                {a}
              </DropdownMenu.CheckboxItem>
            ))}
            <DropdownMenu.Separator />
            <DropdownMenu.Item
              color="red"
              onClick={(e) => {
                e.preventDefault();
                setCheckedAges(new Set(allAges));
              }}
            >
              Check All
            </DropdownMenu.Item>
            <DropdownMenu.Item
              color="red"
              onClick={(e) => {
                e.preventDefault();
                setCheckedAges(new Set());
              }}
            >
              Uncheck All
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </Flex>
      <ReactApexChart
        type="line"
        height={350}
        series={[
          {
            type: 'line',
            name: 'Departure',
            data: chartLogs.map((log) => log.leave),
          },
          {
            type: 'line',
            name: 'Arrival',
            data: chartLogs.map((log) => log.enter),
          },
        ]}
        options={{
          chart: {
            height: 350,
            type: 'line',
            animations: {
              speed: 500,
            },
            toolbar: {
              show: false,
            },
          },
          colors: ['#d4526e', '#33b2df', '#d4526e', '#33b2df'],
          dataLabels: {
            enabled: false,
          },
          fill: {
            opacity: [1, 1],
          },
          forecastDataPoints: {
            count: 2,
          },
          title: {
            text: 'Passengers Summary Every 3 Hours',
            align: 'left',
          },
          stroke: {
            curve: 'straight',
          },
          legend: {
            horizontalAlign: 'right',
            offsetY: 10,
            show: true,
            inverseOrder: true,
          },
          markers: {
            hover: {
              sizeOffset: 5,
            },
          },
          xaxis: {
            categories: chartLogs.map((log) => {
              console.log(log.date);
              return log.date.format('YYYY-MM-DD HH:mm');
            }),
          },
        }}
      />
    </Theme>
  );
}
