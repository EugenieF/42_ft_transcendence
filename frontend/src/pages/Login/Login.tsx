import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useSignIn, useTwoFALogin } from "./hooks";

import { BASE_URL, API42_URL, API42_CLIENT_ID, API42_REDIRECT } from "@/constants";
import { Logo_42, Logo_Eve, Logo_Google } from "@assets";
import "./Login.css";
import { customFetch } from "@/helpers";

export const Login42: React.FC = () => {
  const body = {
    client_id: API42_CLIENT_ID,
    redirect_uri: API42_REDIRECT,
    response_type: "code",
    scope: "public",
  };
  const url_42_auth = API42_URL + "?" + new URLSearchParams(body).toString();

  return (
    <a className="Login_with" href={url_42_auth}>
      <span>Continue with </span>
      <img id="logo-42" alt="42 Logo" src={Logo_42} />
    </a>
  );
};

export const LoginGoogle: React.FC = () => {
  const googleUrl = BASE_URL + "/auth/google";

  return (
    <a className="Login_with" href={googleUrl}>
      <span>Continue with</span>
      <img id="logo-Google" alt="Google Logo" src={Logo_Google} />
    </a>
  );
};

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const twoFALogin = useTwoFALogin();
  const [isActivated, setIsActivated] = useState<boolean>(false);

  useEffect(() => {
    const fetchToggle2FA = async (): Promise<void> => {
      const toggledValue = await twoFAstatus();
      setIsActivated(toggledValue);
    };

    fetchToggle2FA().catch(() => console.log());
  }, []);

  const onSignIn: React.FormEventHandler<HTMLFormElement> = (form) => {
    form.preventDefault();
    const formData = new FormData(form.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email === "string" && typeof password === "string") {
      signIn({
        email,
        password,
      });
    }
  };

  async function twoFAstatus(): Promise<boolean> {
    try {
      const response = await customFetch("GET", "auth/2FA/status");
      if (response.ok) {
        const data = (await response.json()) as { twoFA: boolean };
        if (data.twoFA) {
          return true;
        }
      } else {
        return false;
      }
    } catch (error) {
      console.error("status 2FA not updated");
    }

    return false;
  }

  async function submitVerificationCode(e: any): Promise<void> {
    e.preventDefault();
    const code = e.target.verificationCode.value;
    twoFALogin({ code: code });
  }

  return (
    <div className="Login">
      <form className="form" onSubmit={onSignIn}>
        <img id="login-robot" src={Logo_Eve} />
        <input className="input" type="text" name="email" placeholder="Email" required />
        <input className="input" type="password" name="password" placeholder="Password" required />
        <div className="form-sign">
          <input className="submit" type="submit" value="Sign in" />
          <button className="login-link" onClick={() => navigate("/Signup")}>
            Sign up
          </button>
        </div>
        {!isActivated ? (
          <div className="continue-with" id="continue-with">
            <Login42 />
            <LoginGoogle />
          </div>
        ) : (
          <div className="popup-content">
            <p>Please enter the verification code sent to your email:</p>
            <input type="number" name="verificationCode" style={{ color: "black" }} />
            <button type="submit"> Valider</button>
          </div>
        )}
      </form>
    </div>
  );
};
