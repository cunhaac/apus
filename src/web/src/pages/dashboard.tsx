import axios from "axios";
import dayjs from "dayjs";

import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import duration from "dayjs/plugin/duration";

import React, { useContext, useEffect, useState } from "react";
import { ProgressCards, SideBar, SmokeButton } from "../components";
import { useDidMount } from "../hooks";
import { AuthContext } from "../context/authContext";

export const DashboardPage: React.FC = () => {
  dayjs.extend(utc);
  dayjs.extend(timezone);
  dayjs.extend(duration);
  dayjs.tz.setDefault("Europe/London");

  const { authToken, getConfiguration, userConfig } = useContext(AuthContext);
  const [loadingState, setLoadingState] = useState<boolean>(false);

  const [cigaretteTime, setCigaretteTime] = useState<Date | null | undefined>(
    userConfig?.smoke_log.next_cigarette
  );

  const [nextCigaretteFormatted, setNextCigaretteFormatted] =
    useState<string>("0:0:0:0");

  let interval: number;

  useDidMount(() => {
    window.scrollTo(0, 0);
    getConfiguration(authToken);
  });

  const updateCountdown = () => {
    const diffDuration = dayjs(cigaretteTime).diff(dayjs());

    if (diffDuration <= 0) {
      clearInterval(interval);
    }

    setNextCigaretteFormatted(
      `${Math.floor(diffDuration / (1000 * 60 * 60 * 24))}:${Math.floor(
        (diffDuration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      )}:${Math.floor(
        (diffDuration % (1000 * 60 * 60)) / (1000 * 60)
      )}:${Math.floor((diffDuration % (1000 * 60)) / 1000)}`
    );

    interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  };

  const handleOnClickSmoke = () => {
    setLoadingState(true);

    axios
      .post(
        "https://api.apu-s.space/smoke",
        {
          last_cigarette: dayjs().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]"),
        },
        { headers: { token: authToken } }
      )
      .then((response) => {
        setCigaretteTime(response.data.last_cigarette);
      })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        getConfiguration();
        cigaretteTime && setLoadingState(false);
      });
  };

  useEffect(() => {
    updateCountdown();
  }, []);

  return (
    <div className="flex">
      <SideBar />
      <div className="bg-gray-100 dark:bg-gray-800 w-screen">
        <div className="mt-3">
          <ProgressCards
            phaseLevel="5"
            phaseCompleted="80%"
            savedCigarettes="25"
            savedMoney="1 500,56 €"
          />
        </div>

        <div className="flex flex-col md:flex-row">
          <SmokeButton
            onClickSmoke={handleOnClickSmoke}
            timeToNextCigarette={nextCigaretteFormatted}
            isLoading={loadingState}
          />

          <div className="border-4 border-purple-500 rounded-lg h-[28rem] md:h-[38rem] lg:h-[42rem] p-4 md:w-2/3 my-4 mx-4 md:mr-4 lg:mr-8">
            <p>History</p>
          </div>
        </div>
      </div>
    </div>
  );
};
