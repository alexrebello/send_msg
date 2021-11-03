import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";

type User = {
  id: string;
  name: string;
  login: string;
  avatar_url: string;
}

type AuthContextData = {
  user: User | null;
  signInUrl: string;
  signInOut: () => void;
}

export const AuthContext = createContext({} as AuthContextData);

type AuthProvider = {
  children: ReactNode;
}

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    avatar_url: string;
    login: string;
  }
}

export function AuthProvider(props: AuthProvider) {

  const [user, setUser] = useState<User | null>(null)

  const signInUrl = `https://github.com/login/oauth/authorize?scope=user&client_id=8bd688b728911ff0400f`;

  async function sigIn(gitHubCode: string) {

    const response = await api.post<AuthResponse>('authenticate', {
      code: gitHubCode,
    })

    //console.log(`response: ${response.data}`);
    const { token, user } = response.data;

    localStorage.setItem('@dowhile:token', token);
    //console.log(user);
    api.defaults.headers.common.authorization = 'Bearer ${token}';
    setUser(user);
  }

  function signInOut() {
    setUser(null);
    localStorage.removeItem('@dowhile:token');
  }

  useEffect(() => {
    const token = localStorage.getItem('@dowhile:token')

    if (token) {
      api.defaults.headers.common.authorization = 'Bearer ${token}';

      api.get<User>('profile').then(response => {
        setUser(response.data);
      })
    }
  }, [])

  useEffect(() => {
    const url = window.location.href;
    const hasGitHubCode = url.includes('?code=');

    if (hasGitHubCode) {
      const [urlWithoutCode, gitHubCode] = url.split('?code=');

      window.history.pushState({}, '', urlWithoutCode);
      //console.log(`gitHubCode: ${gitHubCode}`);
      sigIn(gitHubCode);
    }
  }, [])

  return (
    <AuthContext.Provider value={{ signInUrl, user, signInOut }}>
      {props.children}
    </AuthContext.Provider>
  )
}