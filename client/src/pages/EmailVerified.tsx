import { useEffect } from "react";

const EmailVerified = () => {
  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage("email-verified", "*");
      window.close();
    } else {
      window.location.href = "/login?verified=true";
    }
  }, []);

  return <div>Confirmed, you are being redirected...</div>;
};

export default EmailVerified;
