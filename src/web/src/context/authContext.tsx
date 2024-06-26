import { createContext, useState, ReactNode, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export interface userConfigurationResponse {
  user: {
    username: string;
    email: string;
    password: string;
    is_first_time: boolean;
  };
  quiz: {
    cigarettes_per_day: number | null;
    price_per_package: number | null;
    cigarettes_per_package: number | null;
  };
  smoke_log: {
    last_cigarette: Date | null;
    next_cigarette: Date | null;
  };
  history: Date[];
  saved_cigarettes_and_money: {
    total_saved_cigarettes: number;
    total_saved_money: number;
  };
  current_reduction_phase: {
    phase_number: number;
    percentage_reduction_phase: number;
    time_between_cigarettes: number;
  };
}

interface CurrentUserContextType {
  authToken: string | undefined;
  setAuthToken: React.Dispatch<React.SetStateAction<string | undefined>>;

  user: string | undefined;
  setUser: React.Dispatch<React.SetStateAction<string | undefined>>;

  callLogout: () => void;
  getConfiguration: (authTokenProp?: string) => void;
}

interface Props {
  children: ReactNode;
}

export const AuthContext = createContext<CurrentUserContextType>(
  {} as CurrentUserContextType
);

export const AuthProvider: React.FC<Props> = ({ children }) => {
  let navigate = useNavigate();

  let [authToken, setAuthToken] = useState<string | undefined>(() =>
    localStorage.getItem("authToken")
      ? JSON.parse(localStorage.getItem("authToken") || "")
      : undefined
  );

  let [user, setUser] = useState<string | undefined>(() =>
    localStorage.getItem("authToken")
      ? jwtDecode(localStorage.getItem("authToken") || "")
      : undefined
  );

  //Call logout
  function callLogout() {
    axios
      .post(
        "https://api.apu-s.space/logout",
        {},
        { headers: { token: authToken } }
      )
      .then(function () {
        setAuthToken(undefined);
        setUser(undefined);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userConfig");
      })
      .catch(function (error) {
        console.log("logout error: ", error);
        setAuthToken(undefined);
        setUser(undefined);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userConfig");
      });
  }

  // Updating refresh token
  function updateAccess() {
    if (authToken) {
      axios
        .post(
          "https://api.apu-s.space/token-refresh",
          {},
          { headers: { token: authToken } }
        )
        .then(function (response) {
          const newToken = response.data.access_token;

          setAuthToken(newToken);
          setUser(jwtDecode(newToken));
          localStorage.setItem("authToken", JSON.stringify(newToken));
        })
        .catch(function (error) {
          console.log(error);
          callLogout();
        });
    }
  }

  // Updating refresh token after revisit and access token expire time
  useEffect(() => {
    let twentyMinutes = 1000 * 60 * 20;

    let interval = setInterval(() => {
      if (authToken) {
        updateAccess();
      }
    }, twentyMinutes);
    return () => clearInterval(interval);
  }, [authToken]);

  function getConfiguration(authTokenProp?: string) {
    axios
      .get("https://api.apu-s.space/configuration", {
        headers: {
          token: authTokenProp ? authTokenProp : authToken,
        },
      })
      .then((response) => {
        localStorage.setItem(
          "userConfig",
          JSON.stringify(response.data.config)
        );

        response.data.config.user.is_first_time
          ? navigate("/quiz")
          : navigate("/dashboard");
      })
      .catch((error) => {
        console.log(error);
        callLogout();
      });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setAuthToken,
        setUser,
        authToken,
        callLogout,
        getConfiguration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
