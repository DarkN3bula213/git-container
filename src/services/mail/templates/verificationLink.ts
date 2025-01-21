export const verificationLinkTemplate = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Email Verification</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Nunito&display=swap" />
    <style>
      a {
        color: #2ca16d;
        text-decoration: none;
      }
      main {
        background-color: #f9f9f9;
        padding-left: 1.25rem;
        padding-right: 1.25rem;
        padding-bottom: 1rem;
      }
      .layout {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        font-family: Nunito, sans-serif;
      }
      .border {
        border-style: solid;
        border-width: 1px;
        border-color: #2ca16d;
        border-radius: 0.25rem;
      }
      p {
        line-height: 1.5;
        color: #4b5563;
      }
      .card {
        height: 200px;
        background: linear-gradient(to right, #4caf50, #45a049);
        width: 100%;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 1.25rem;
        border-radius: 15px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.41);
      }

      .btn {
        padding-left: 1.25rem;
        padding-right: 1.25rem;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        margin-top: 1.5rem;
        font-size: 14px;
        text-transform: capitalize;
        background-color: #2ca16d;
        color: #fff;
        transition-property: background-color;
        transition-duration: 300ms;
        transform: none;
        border-radius: 0.375rem;
        border-width: 1px;
        border: none;
        outline: none;
        cursor: pointer;
      }
      @media (min-width: 640px) {
        .footertext {
          font-size: 16px;
        }
      }
    </style>
  </head>
  <body>
    <div class="layout">
      <section
        style="
          max-width: 42rem;
          background-color: #f9f9f9;
          border-radius: 15px;
          overflow: hidden;
        "
      >
        <div class="card">
          <div style="display: flex; align-items: center; gap: 0.75rem">
            <div
              style="width: 2.5rem; height: 1px; background-color: #fff"
            ></div>
            <svg
              stroke="currentColor"
              fill="currentColor"
              stroke-width="0"
              viewBox="0 0 24 24"
              height="20"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path fill="none" d="M0 0h24v24H0V0z"></path>
              <path
                d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z"
              ></path>
            </svg>
            <div
              style="width: 2.5rem; height: 1px; background-color: #fff"
            ></div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 1.25rem">
            <div
              style="text-align: center; font-size: 14px; font-weight: normal"
            >
              THANKS FOR SIGNING UP!
            </div>
            <div
              style="
                font-size: 24px;
                font-weight: bold;
                text-transform: capitalize;
                text-align: center;
              "
            >
              Verify your E-mail Address
            </div>
          </div>
        </div>
        <main>
          <p>Please use the following One Time Password (OTP)</p>

          <div style="text-align: center; margin: 30px 0">
            <span
              style="
                font-size: 32px;
                font-weight: bold;
                letter-spacing: 5px;
                color: #4caf50;
              "
              >{verificationCode}</span
            >
          </div>
          <p style="margin-top: 1rem; line-height: 1.75; color: #4b5563">
            This passcode will only be valid for the next
            <span style="font-weight: 900; color: #111"> 15 minutes</span>. If
            the passcode does not work, you can use this login verification
            link:
          </p>
          <a class="btn" href="{baseUrl}/verify/{verificationCode}"
            >Verify email</a
          >
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #4caf50">
            {baseUrl}/verify/{verificationCode}
          </p>
          <p>This link will expire in 15 minutes for security reasons.</p>
        </main>
      </section>
      <div
        style="
          text-align: center;
          margin-top: 20px;
          color: #888;
          font-size: 0.8em;
        "
      >
        <p>This is an automated message, please do not reply to this email.</p>
      </div>
    </div>
  </body>
</html>
`;
